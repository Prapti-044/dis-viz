from functools import lru_cache
import simpleoptparser as sopt
import json
from instructions import AddressRange, BlockPage, Function, Hidable, Instruction, InstructionBlock, BlockLink, LineCorrespondence, Loop, Variable, VariableLocation
from tqdm import tqdm

N_INSTRUCTIONS_PER_PAGE = 50

@lru_cache(maxsize=10)
def decode_cache_binary(filepath: str):
    sopt.decode(filepath)
    disassembly = json.loads(sopt.get_assembly())

    blocks = [InstructionBlock(
        block_number = int(next(iter(block.keys()))[1:]),
        function_name = block['function_name'],
        instructions = [Instruction(
            address = instruction['address'],
            instruction = instruction['instruction'],
            correspondence = {},
            variables = [],
        ) for instruction in next(iter(block.values()))]
    ) for block in disassembly['blocks']]

    blocks.sort(key=lambda block: block.start_address)

    links = [
        BlockLink(
            source=int(link['source']),
            target=int(link['target'])
        ) for link in disassembly['links']
    ]

    pages = [[ blocks[0] ]]
    for block in blocks[1:]:
        if sum(len(block) for block in pages[-1]) >= N_INSTRUCTIONS_PER_PAGE:
            pages.append([])
        pages[-1].append(block)

    pages = [BlockPage(blocks=page, page_no=i) for i, page in enumerate(pages)]
    pages[-1].is_last = True

    source_files = json.loads(sopt.get_sourcefiles())

    dyninst_info = json.loads(sopt.get_json())

    line_correspondence = sorted([
        LineCorrespondence(
            source_file=line['file'],
            start_address=line['from'],
            end_address=line['to'],
            source_line=line['line'],
        ) for line in dyninst_info['lines']
    ], key=lambda lc: lc.start_address)


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
            loops=[Loop(
                blocks=loop['blocks'],
                backedges=[{
                    'start_address': ad_range['from'],
                    'end_address': ad_range['to'],
                } for ad_range in loop['backedges']],
                name=loop['name'],
                loops=None # TODO: fix this
            ) for loop in function['loops']] if function['loops'] else [],
            hidables=[Hidable(
                start_address=hidable['start'],
                end_address=hidable['end'],
                name=hidable['name']
            ) for hidable in function['hidables']]
        ) for function in dyninst_info['functions']
    ]

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
            
            # for function in functions:
            #     for variable in function.variables:
            #         for variable_location in variable.locations:
            #             if variable_location.start_address <= ins.address <= variable_location.end_address:
            #                 ins.variables.append(variable)





    dot : dict[str, str] = {"dot": sopt.get_dot()}

    return {
        'disassembly': {
            'blocks': blocks,
            'links': links,
            'pages': pages
        },
        'source_files': source_files,
        'dyninst_info': {
            'line_correspondence': line_correspondence,
            'functions': functions
        },
        'dot': dot
    }
