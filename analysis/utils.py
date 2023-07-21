from ast import List
from functools import lru_cache
from typing import Any, Callable, Dict, Iterable, Type, TypeVar
import simpleoptparser as sopt
import json
from instructions import BlockPage, Function, Hidable, Instruction, InstructionBlock, BlockLink, LineCorrespondence, Loop, Variable, VariableLocation
from tqdm import tqdm
from bisect import bisect_left
import copy

from pprint import pprint

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
            backedges=loop['backedges'],
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
                    
                    # Check if there is  Multple source file for a single disassembly line
                    # if len(ins.correspondence) > 1 or len(ins.correspondence[lc.source_file]) > 1:
                    #     print("Found more than 1 correspondence", ins)
        
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

    # Hidables
    # for function in tqdm(functions, desc="Embedding Hidables"):
    #     fn_blocks = list(filter(lambda b: b.function_name == function.name, blocks))
    #     for block in fn_blocks:
    #         for hidable in function.hidables:
    #             if hidable.start_address >= block.start_address and hidable.end_address <= block.end_address:
    #                 block.hidables.append(hidable)

    loop_count = {}
    def add_loops_to_blocks(blocks, loop):
        for block in blocks:
            if block.name in loop.blocks:
                for inner_loop in loop.loops:
                    if block.name in inner_loop.blocks:
                        loop_count[loop.name] = loop_count.setdefault(loop.name, 0)
                        break
                else:
                    loop_count[loop.name] = loop_count.setdefault(loop.name, 0) + 1
                    
                block.loops.append({
                    'name': loop.name,
                    'loop_count': loop_count[loop.name],
                    'loop_total': -1
                })

                for backedge in loop.backedges:
                    if backedge['from'] == block.name:
                        block.backedges.append(backedge['to'])

        if loop.loops:
            for inner_loop in loop.loops:
                add_loops_to_blocks(blocks, inner_loop)

    # Loops
    max_loop_count: int = -1
    for function in tqdm(functions, desc="Loop Processing"):
        fn_blocks = list(filter(lambda b: b.function_name == function.name, blocks))
        for loop in function.loops:
            loop_count.clear()
            add_loops_to_blocks(fn_blocks, loop)

            for block in fn_blocks:
                if len(block.loops) > max_loop_count:
                    max_loop_count = len(block.loops)

                for loop in block.loops:
                    if loop['name'] in loop_count:
                        loop['loop_total'] = loop_count[loop['name']]


    # Creating order for loop structure
    def get_all_blocks_in_loop(blocks: list[InstructionBlock], loop: Loop, visited_blocks: list[str]):
        blocks_in_loop = []
        for block in filter(lambda b: b.name in loop.blocks, blocks):
            if block.name in visited_blocks:
                continue
            if loop.loops:
                for inner_loop in loop.loops:
                    if block.name in inner_loop.blocks:
                        blocks_in_loop += get_all_blocks_in_loop(blocks, inner_loop, visited_blocks)
                        break
                else:
                    visited_blocks.append(block.name)
                    blocks_in_loop.append(block)
            else:
                visited_blocks.append(block.name)
                blocks_in_loop.append(block)

        return blocks_in_loop
        

    loop_order_blocks = []
    __visited_blocks = []
    for fn in tqdm(functions, desc="Loop Order"):
        fn_blocks = sorted(list(filter(lambda b: b.function_name == fn.name, blocks)), key=lambda b: b.start_address)
        for fn_block in fn_blocks:
            if fn_block.name in __visited_blocks:
                continue
            
            if fn_block.loops:
                all_loop_blocks = get_all_blocks_in_loop(
                    fn_blocks,
                    next(filter(
                        lambda l: l.name in map(lambda l2: l2['name'], fn_block.loops),
                        fn.loops
                    ), Loop([], [], None, '')),
                    __visited_blocks
                )
                loop_order_blocks += all_loop_blocks

            else:
                __visited_blocks.append(fn_block.name)
                loop_order_blocks.append(fn_block)
                
    # Loop order pages
    loop_order_pages = [[ loop_order_blocks[0] ]]
    for block in loop_order_blocks[1:]:
        if sum(len(block) for block in loop_order_pages[-1] if block.block_type == 'normal') >= N_INSTRUCTIONS_PER_PAGE:
            loop_order_pages.append([])
        loop_order_pages[-1].append(block)

    loop_order_pages = [BlockPage(blocks=page, page_no=i) for i, page in enumerate(loop_order_pages)]
    loop_order_pages[-1].is_last = True


    # Creating pseudo blocks for loops
    processed_loops = [] # fn_name:loop_name
    idx = 0
    while idx+1 < len(blocks):
        if blocks[idx].loops and blocks[idx].loops[-1]['name'] in processed_loops:
            idx += 1
            continue

        block_loop_names = [loop['name'] for loop in blocks[idx].loops]
        next_block_loop_names = [loop['name'] for loop in blocks[idx+1].loops]

        if all(loop_name in block_loop_names for loop_name in next_block_loop_names) and len(block_loop_names) > len(next_block_loop_names):
            # Check if this is the last block of this loop
            if blocks[idx].loops[-1]['loop_count'] != blocks[idx].loops[-1]['loop_total']:
                
                pseudo_blocks = []
                for block in blocks[idx+1:]:
                    if block.loops and block.loops[-1]['name'] == blocks[idx].loops[-1]['name'] and blocks[idx].function_name == block.function_name:
                        pseudo_block = copy.deepcopy(block)
                        pseudo_block.block_type = 'pseudoloop'
                        pseudo_blocks.append(pseudo_block)
                        if pseudo_block.loops[-1]['loop_count'] == pseudo_block.loops[-1]['loop_total']:
                            break

                processed_loops.append(f"{blocks[idx].function_name}:{blocks[idx].loops[-1]['name']}")
                idx += 1
                for pseudo_block in pseudo_blocks:
                    blocks.insert(idx, pseudo_block)
                    idx += 1
        idx += 1

    # Minimap data
    # memory order
    block_heights = [(block.n_instructions if block.block_type == 'normal' else 0) for block in blocks]
    block_loop_indents = [len(block.loops) for block in blocks]

    built_in_block = [
        all(
            source_file.lower().startswith(tuple(SYSTEM_LOCATIONS)) for source_file in block.instructions[0].correspondence.keys()
        ) for block in blocks
    ]
    loop_order_built_in_block = [
        all(
            source_file.lower().startswith(tuple(SYSTEM_LOCATIONS)) for source_file in block.instructions[0].correspondence.keys()
        ) for block in loop_order_blocks
    ]

    
    # loop order
    loop_order_block_heights = [block.n_instructions if block.block_type == 'normal' else 0 for block in loop_order_blocks]
    loop_order_block_loop_indents = [len(block.loops) for block in loop_order_blocks]

    # Preprocessing pages
    pages = [[ blocks[0] ]]
    for block in blocks[1:]:
        if sum(len(block) for block in pages[-1] if block.block_type == 'normal') >= N_INSTRUCTIONS_PER_PAGE:
            pages.append([])
        pages[-1].append(block)

    pages = [BlockPage(blocks=page, page_no=i) for i, page in enumerate(pages)]
    pages[-1].is_last = True

    dot : dict[str, str] = {"dot": sopt.get_dot()}

    return {
        'disassembly': {
            'memory_order': {
                'blocks': blocks,
                'links': links,
                'pages': pages
            },
            'loop_order': {
                'blocks': loop_order_blocks,
                'links': links,
                'pages': loop_order_pages
            },
        },
        'minimap': {
            'memory_order': {
                'block_heights': block_heights,
                'built_in_block': built_in_block,
                'block_start_address': [block.start_address for block in blocks],
                'block_loop_indents': block_loop_indents
            },
            'loop_order': {
                'block_heights': loop_order_block_heights,
                'built_in_block': loop_order_built_in_block,
                'block_start_address': [block.start_address for block in blocks],
                'block_loop_indents': loop_order_block_loop_indents
            },
        },
        'source_files': source_files,
        'dyninst_info': {
            'line_correspondence': line_correspondence,
            'functions': functions
        },
        'dot': dot
    }


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
