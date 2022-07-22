import TabContent from "./components/TabContent";
import DisassemblyView from "./components/DisassemblyView";
import { DisassemblyLineSelection, DyninstInfo, SourceViewData } from "./types";
import InputFilePath from "./components/InputFilePath";

export function CreateInputFilePath(binaryFilePath: string, setBinaryFilePath: (path: string) => void, sourceViewStates: SourceViewData[]) {
    return <TabContent><InputFilePath
            binaryFilePath={binaryFilePath}
            setBinaryFilePath={setBinaryFilePath}
            sourceViewData={sourceViewStates}
            key={"InputFilePath:1"}
          /></TabContent>
}

export function CreateDisassemblyView(
    id: number,
    binaryFilePath: string,
    activeDisassemblyView: number | null,
    setActiveDisassemblyView: (id: number|null) => void,
    lineSelection: DisassemblyLineSelection | null,
    pageNo: number,
    setNewSelection: (newSelection: DisassemblyLineSelection | null) => void,
    dyninstInfo: DyninstInfo,
) {
    setActiveDisassemblyView(id)
    return <TabContent><DisassemblyView
        binaryFilePath={binaryFilePath}
        active={true}
        setActive={disassemblyViewId => {
            setActiveDisassemblyView(disassemblyViewId);
        } }
        key={"DisassemblyView:" + id}
        id={id}
        lineSelection={lineSelection}
        setNewSelection={setNewSelection}
        dyninstInfo={dyninstInfo}
        pageNo={pageNo} /></TabContent>
}