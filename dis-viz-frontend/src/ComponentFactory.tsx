import TabContent from "./components/TabContent";
import DisassemblyView from "./components/DisassemblyView";
import { DisassemblyLineSelection, DyninstInfo, ReactContext, SourceLineSelection, SourceViewData } from "./types";
import InputFilePath from "./components/InputFilePath";
import React from "react";
import SourceView from "./components/SourceView";
import { Context } from './App'

export function CreateInputFilePath(binaryFilePath: string, setBinaryFilePath: (path: string) => void, sourceViewStates: SourceViewData[], context: React.Context<ReactContext>) {
    return <TabContent><context.Consumer>
        {(val) => (
            <InputFilePath
                binaryFilePath={val.binaryFilePath}
                setBinaryFilePath={val.setBinaryFilePath}
                sourceViewData={val.sourceViewStates}
                key={"InputFilePath:1"}
                setSourceViewData={val.setSourceViewStates}
                activeDisassemblyView={val.activeDisassemblyView}
            />
        )}
    </context.Consumer></TabContent>
}

export function CreateSourceView(
    sourceViewState: SourceViewData,
    setNewSelection: (_: {start: number, end: number}) => void
) {
    return <TabContent>
        <Context.Consumer>
        {val => (
            <SourceView
                sourceViewState={sourceViewState}
                setNewSelection={setNewSelection}
            ></SourceView>
        )}
        </Context.Consumer>
    </TabContent>
}

export function CreateDisassemblyView(
    id: number,
    binaryFilePath: string,
    activeDisassemblyView: number | null,
    setActiveDisassemblyView: (id: number | null) => void,
    lineSelection: DisassemblyLineSelection | null,
    pageNo: number,
    setNewSelection: (newSelection: DisassemblyLineSelection | null) => void,
    dyninstInfo: DyninstInfo,
    context: React.Context<ReactContext>
) {
    return <TabContent><context.Consumer>
        {(val) => (
            <DisassemblyView
                binaryFilePath={val.binaryFilePath}
                active={val.activeDisassemblyView === id}
                setActive={disassemblyViewId => {
                    setActiveDisassemblyView(disassemblyViewId);
                }}
                key={"DisassemblyView:" + id}
                id={id}
                // lineSelection={val.disassemblyViewStates.find(disState => disState.id === id)!.lineSelection}
                lineSelection={lineSelection}
                setNewSelection={setNewSelection}
                dyninstInfo={val.binaryData.dyninstInfo}
                pageNo={pageNo}
            />)}
    </context.Consumer>
    </TabContent>
}