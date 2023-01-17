from functools import lru_cache
import simpleoptparser as sopt
import json
from instructions import AddressRange, BlockPage, Function, Hidable, Instruction, InstructionBlock, BlockLink, LineCorrespondence, Loop, Variable, VariableLocation
from tqdm import tqdm

N_INSTRUCTIONS_PER_PIXEL_MINIMAP = 5
N_INSTRUCTIONS_PER_PAGE = 500
SYSTEM_LOCATIONS = [
    '/usr/',
]

@lru_cache(maxsize=10)
def decode_cache_binary(filepath: str):
    sopt.decode(filepath)
    disassembly = json.loads(sopt.get_assembly())

    # Getting block objects
    blocks = [InstructionBlock(
        name = block["name"],
        function_name = block['function_name'],
        instructions = [Instruction(
            address = instruction['address'],
            instruction = instruction['instruction'],
            correspondence = {},
            variables = [],
        ) for instruction in block["instructions"]]
    ) for block in disassembly['blocks']]

    # Creating links between blocks
    blocks.sort(key=lambda block: block.name)
    links = [
        BlockLink(
            source=link['source'],
            target=link['target']
        ) for link in disassembly['links']
    ]
    links.sort(key=lambda link: link.source)

    # Populating blocks with their next block
    for link_i, link in tqdm(enumerate(links), desc="Adding block links"):

        block_pos = binary_search(blocks, link.source, 0, len(blocks), lambda block: block.name, not_found=None)

        if block_pos and block_pos+1 < len(blocks) and link.target == blocks[block_pos+1].name: continue

        if block_pos:
            blocks[block_pos].next_block_numbers.append(link.target)

    blocks.sort(key=lambda block: block.start_address)


    # Preprocessing pages
    pages = [[ blocks[0] ]]
    for block in blocks[1:]:
        if sum(len(block) for block in pages[-1]) >= N_INSTRUCTIONS_PER_PAGE:
            pages.append([])
        pages[-1].append(block)

    pages = [BlockPage(blocks=page, page_no=i) for i, page in enumerate(pages)]
    pages[-1].is_last = True

    source_files = json.loads(sopt.get_sourcefiles())

    dyninst_info = json.loads(sopt.get_json())

    # Getting line correspondences
    line_correspondence = sorted([
        LineCorrespondence(
            source_file=line['file'],
            start_address=line['from'],
            end_address=line['to'],
            source_line=line['line'],
        ) for line in dyninst_info['lines']
    ], key=lambda lc: lc.start_address)

    def create_loop_obj(loop):
        return Loop(
            blocks=loop['blocks'],
            backedges=[{
                'start_address': ad_range['from'],
                'end_address': ad_range['to'],
            } for ad_range in loop['backedges']],
            name=loop['name'],
            loops=[create_loop_obj(inner_loop) for inner_loop in loop['loops']] if 'loops' in loop and loop['loops'] else []
        ) if loop else []

    # Creating functions objects
    functions = [
        Function(
            name=function['name'],
            variables=[Variable(
                name=variable['name'],
                source_file=variable['file'],
                source_line=variable['line'],
                locations=[VariableLocation(
                    start_address=int(location['start'], 16),
                    end_address=int(location['end'], 16),
                    location=location['location']
                ) for location in variable['locations']]
            ) for variable in function['vars']],
            loops=[create_loop_obj(loop) for loop in function['loops']] if function['loops'] else [],
            hidables=[Hidable(
                start_address=hidable['start'],
                end_address=hidable['end'],
                name=hidable['name']
            ) for hidable in function['hidables']]
        ) for function in dyninst_info['functions']
    ]

    # Embedding correspondence between each instructions
    lc_i = 0
    for block in tqdm(blocks, desc="Preprocessing Correspondence"):
        for ins in block.instructions:
            for lc in line_correspondence[lc_i:]:
                if lc.start_address <= ins.address < lc.end_address:
                    if lc.source_file not in ins.correspondence:
                        ins.correspondence = {
                            lc.source_file: []
                        }
                    ins.correspondence[lc.source_file] = list(set(ins.correspondence[lc.source_file] + [lc.source_line]))
        
                while lc_i < len(line_correspondence) and ins.address > line_correspondence[lc_i].end_address:
                    lc_i += 1

                if lc.start_address > ins.address:
                    break
            
    # Embedding Variables in each instructions
    for function in tqdm(functions, desc="Variable Renaming"):
        fn_blocks = list(filter(lambda b: b.function_name == function.name, blocks))
        for variable in function.variables:
            for variable_location in variable.locations:
                for ins in [ins for fn_block in fn_blocks for ins in fn_block.instructions]:
                    if variable_location.start_address <= ins.address <= variable_location.end_address and variable_location.location in ins.instruction:
                        ins.variables.append(variable)

    # Minimap data
    block_heights = [block.n_instructions for block in blocks]

    built_in_block = [
        all(
            source_file.lower().startswith(tuple(SYSTEM_LOCATIONS)) for source_file in block.instructions[0].correspondence.keys()
        ) for block in blocks
    ]

    # Hidables
    for function in tqdm(functions, desc="Embedding Hidables"):
        fn_blocks = list(filter(lambda b: b.function_name == function.name, blocks))
        for block in fn_blocks:
            for hidable in function.hidables:
                if hidable.start_address >= block.start_address and hidable.end_address <= block.end_address:
                    block.hidables.append(hidable)



    dot : dict[str, str] = {"dot": sopt.get_dot()}

    return {
        'disassembly': {
            'blocks': blocks,
            'links': links,
            'pages': pages
        },
        'minimap': {
            'block_heights': block_heights,
            'built_in_block': built_in_block,
            'block_start_address': [block.start_address for block in blocks]
        },
        'source_files': source_files,
        'dyninst_info': {
            'line_correspondence': line_correspondence,
            'functions': functions
        },
        'dot': dot
    }

    

from bisect import bisect_left

class KeyWrapper:
    def __init__(self, iterable, key):
        self.it = iterable
        self.key = key

    def __getitem__(self, i):
        return self.key(self.it[i])

    def __len__(self):
        return len(self.it)

def binary_search(a, x, lo=0, hi=None, key=lambda _x: _x, not_found=None):
    if hi is None: hi = len(a)
    pos = bisect_left(KeyWrapper(a, key=key), x, lo, hi)
    return pos if pos != hi and key(a[pos]) == x else not_found
