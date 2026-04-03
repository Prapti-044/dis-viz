import React from 'react'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import 'bootstrap/dist/css/bootstrap.min.css'
import * as disvizProcessor from "../disvizProcessor"
import '../styles/inputsourcefilepath.css'
import {
    Tooltip,
    Alert as MuiAlert,
    Box,
    Button as MuiButton,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material'
import { 
    reorderBinaryFilePaths, 
    removeLoadedFile, 
    syncWithLoadedFiles,
    selectBinaryFilePaths,
    selectSemanticCompareLeft,
    selectSemanticCompareRight,
    setSemanticComparePair,
} from '../features/binary-data/binaryDataSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { toast } from 'react-toastify'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MdDragIndicator, MdDelete, MdUpload, MdCloudUpload, MdFileDownload, MdPlayArrow, MdExpandMore, MdExpandLess, MdInfo } from 'react-icons/md'
import {
    buildSemanticDiffDocument,
    downloadSemanticDiffJson,
    extractSemanticBlob,
} from '../semantic/buildSemanticDiff'

// Helper function to get metadata for a loaded file
function getFileMetadata(fileName: string) {
    try {
        const binaryList = disvizProcessor.getBinaryList();
        const file = binaryList.find(f => f.name === fileName);
        if (!file) return null;

        const sourceFiles = disvizProcessor.getSourceFiles(fileName);
        const addressRange = disvizProcessor.getAddressRange(fileName);
        const metadata = disvizProcessor.getFileMetadata(fileName);
        
        // Get first page to check if there are any blocks
        let memoryOrderBlockCount = 0;
        let loopOrderBlockCount = 0;
        let hasBlocks = false;
        
        try {
            const memoryOrderPage = disvizProcessor.getDisassemblyPage(fileName, 0, 'memory_order');
            memoryOrderBlockCount = memoryOrderPage.blocks.length;
            hasBlocks = true;
        } catch (error) {
            // No blocks available
        }
        
        try {
            const loopOrderPage = disvizProcessor.getDisassemblyPage(fileName, 0, 'loop_order');
            loopOrderBlockCount = loopOrderPage.blocks.length;
            hasBlocks = true;
        } catch (error) {
            // No blocks available
        }
        
        return {
            name: fileName,
            sourceFileCount: sourceFiles.length,
            memoryOrderBlockCount: memoryOrderBlockCount,
            loopOrderBlockCount: loopOrderBlockCount,
            hasBlocks: hasBlocks,
            addressRange: addressRange,
            metadata: metadata
        };
    } catch (error) {
        console.error('Error getting file metadata:', error);
        return null;
    }
}

interface SortableFileItemProps {
    fileName: string;
    index: number;
    onDelete: (fileName: string) => void;
    totalFiles: number;
}

function SortableFileItem({ fileName, index, onDelete, totalFiles }: SortableFileItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: fileName });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Calculate grid visualization
    const row = (index % 2) + 1;
    const col = Math.floor(index / 2) + 1;
    const totalColumns = Math.ceil(totalFiles / 2);

    // Get metadata for tooltip
    const metadata = getFileMetadata(fileName);

    // Create tooltip content
    const tooltipContent = metadata ? (
        <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                {metadata.name}
            </div>
            
            {/* Build metadata */}
            {metadata.metadata && (
                <div style={{ marginBottom: "8px", padding: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "4px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#ffd700" }}>
                        🔨 Build Information
                    </div>
                    <div style={{ fontSize: "11px", color: "#ddd", marginBottom: "2px" }}>
                        <strong>Architecture:</strong> {metadata.metadata.architecture}
                    </div>
                    <div style={{ fontSize: "11px", color: "#ddd", marginBottom: "2px" }}>
                        <strong>Compiler:</strong> {metadata.metadata.compiler}
                    </div>
                    <div style={{ fontSize: "11px", color: "#ddd", marginBottom: "2px" }}>
                        <strong>Flags:</strong> {metadata.metadata.flags.join(", ")}
                    </div>
                    <div style={{ fontSize: "11px", color: "#ddd" }}>
                        <strong>Built:</strong> {metadata.metadata.date} at {metadata.metadata.time}
                    </div>
                </div>
            )}
            
            <div style={{ marginBottom: "4px" }}>
                📁 <strong>Source Files:</strong> {metadata.sourceFileCount}
            </div>
            
            <div style={{ marginBottom: "4px" }}>
                🔧 <strong>Basic Blocks:</strong> {metadata.memoryOrderBlockCount}
            </div>
            
            <div>
                📍 <strong>Address Range:</strong> 
                <div style={{ fontSize: "11px", color: "#666", fontFamily: "monospace" }}>
                    0x{metadata.addressRange.start.toString(16)} - 0x{metadata.addressRange.end.toString(16)}
                </div>
            </div>
        </div>
    ) : 'No metadata available';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="sortable-file-item"
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                padding: "10px",
                margin: "5px 0",
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
            }} className="file-item-content">
                {/* Drag handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="drag-handle"
                    style={{
                        cursor: "grab",
                        padding: "5px",
                        display: "flex",
                        alignItems: "center",
                        marginRight: "10px",
                        color: "#6c757d"
                    }}
                >
                    <MdDragIndicator size={20} />
                </div>

                {/* Grid visualization */}
                <div className="binary-index" style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${totalColumns}, 12px)`,
                    gap: "1px",
                    marginRight: "15px",
                    width: `${totalColumns * 12 + (totalColumns - 1)}px`,
                    height: "25px"
                }}>
                    {[...Array(totalColumns * 2)].map((_, i) => {
                        const squareRow = Math.floor(i / totalColumns) + 1;
                        const squareCol = (i % totalColumns) + 1;
                        return (
                            <div key={i} style={{
                                width: "12px",
                                height: "12px",
                                border: "1px solid #ccc",
                                backgroundColor: (squareRow === row && squareCol === col) ? "#868686" : "transparent",
                            }}></div>
                        );
                    })}
                </div>

                {/* File name */}
                <div style={{
                    flex: 1,
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#495057",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                }}>
                    {fileName}
                </div>

                {/* Info icon with tooltip */}
                <Tooltip 
                    title={tooltipContent}
                    arrow
                    placement="top"
                    componentsProps={{
                        tooltip: {
                            style: {
                                maxWidth: '300px',
                                backgroundColor: '#2c3e50',
                                color: '#ffffff',
                                fontSize: '12px',
                                borderRadius: '6px',
                                padding: '12px'
                            }
                        }
                    }}
                >
                    <div style={{
                        padding: "4px",
                        marginLeft: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        color: "#6c757d",
                        borderRadius: "4px"
                    }}>
                        <MdInfo size={16} />
                    </div>
                </Tooltip>

                {/* Delete button */}
                <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(fileName)}
                    style={{
                        marginLeft: "10px",
                        padding: "4px 8px",
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <MdDelete size={16} />
                </Button>
            </div>
        </div>
    );
}

interface DropZoneProps {
    onFileUpload: (files: FileList) => void;
    isUploading: boolean;
}

function DropZone({ onFileUpload, isUploading }: DropZoneProps) {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFileUpload(files);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileUpload(files);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`drop-zone-compact ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
            style={{
                border: `1px solid ${isDragOver ? '#007bff' : '#dee2e6'}`,
                borderRadius: "6px",
                padding: "12px 16px",
                backgroundColor: isDragOver ? '#f8f9ff' : '#fafafa',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px"
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".disviz"
                multiple
                onChange={handleFileInputChange}
                disabled={isUploading}
                style={{ display: 'none' }}
            />
            
            <MdCloudUpload 
                size={18} 
                color={isDragOver ? '#007bff' : isUploading ? '#6c757d' : '#adb5bd'} 
                style={{ transition: "color 0.2s ease", flexShrink: 0 }}
            />
            
            {isUploading ? (
                <span style={{ color: "#6c757d" }}>
                    Processing files...
                </span>
            ) : (
                <span style={{ 
                    color: isDragOver ? '#007bff' : '#495057',
                    transition: "color 0.2s ease"
                }}>
                    {isDragOver ? 'Drop .disviz files here' : 'Drop files here or click to browse'}
                </span>
            )}
        </div>
    );
}

interface ExampleFilesProps {
    onLoadExample: (fileName: string) => void;
    isLoading: boolean;
}

function ExampleFiles({ onLoadExample, isLoading }: ExampleFilesProps) {
    const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
    
    const exampleFiles = [
        { name: 'bubble-O0.disviz', description: 'Bubble sort with O0 optimization' },
        { name: 'bubble-O1.disviz', description: 'Bubble sort with O1 optimization (semantic diff demo)' },
        { name: 'bubble-O3.disviz', description: 'Bubble sort with O3 optimization' },
    ];

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div style={{ marginBottom: "20px" }}>
            <div style={{
                backgroundColor: "#f1f8ff",
                borderRadius: "8px",
                border: "1px solid #c6e2ff"
            }}>
                {/* Collapsible header */}
                <div 
                    onClick={toggleExpanded}
                    style={{
                        padding: "15px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        userSelect: "none"
                    }}
                >
                    <div style={{ 
                        fontSize: "14px", 
                        color: "#0366d6", 
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <MdFileDownload size={18} />
                        Example Files
                        <span style={{ 
                            fontSize: "12px", 
                            color: "#586069", 
                            fontWeight: "400",
                            fontStyle: "italic"
                        }}>
                            ({exampleFiles.length} available)
                        </span>
                    </div>
                    
                    {isExpanded ? (
                        <MdExpandLess size={20} color="#0366d6" />
                    ) : (
                        <MdExpandMore size={20} color="#0366d6" />
                    )}
                </div>
                
                {/* Collapsible content */}
                {isExpanded && (
                    <div style={{ 
                        padding: "0 15px 15px 15px",
                        borderTop: "1px solid #c6e2ff"
                    }}>
                        <div style={{ 
                            fontSize: "12px", 
                            color: "#586069", 
                            marginBottom: "15px",
                            fontStyle: "italic"
                        }}>
                            Click to load pre-built binary analysis examples
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "8px"
                        }}>
                            {exampleFiles.map((file) => (
                                <Button
                                    key={file.name}
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => onLoadExample(file.name)}
                                    disabled={isLoading}
                                    style={{
                                        padding: "8px 12px",
                                        textAlign: "left",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        fontSize: "12px",
                                        borderRadius: "6px",
                                        backgroundColor: "transparent",
                                        border: "1px solid #c6e2ff"
                                    }}
                                    className="example-file-button"
                                >
                                    <MdPlayArrow size={14} style={{ flexShrink: 0 }} />
                                    <div style={{ overflow: "hidden" }}>
                                        <div style={{ 
                                            fontWeight: "500", 
                                            overflow: "hidden", 
                                            textOverflow: "ellipsis", 
                                            whiteSpace: "nowrap" 
                                        }}>
                                            {file.name}
                                        </div>
                                        <div style={{ 
                                            fontSize: "10px", 
                                            color: "#586069", 
                                            marginTop: "2px",
                                            overflow: "hidden", 
                                            textOverflow: "ellipsis", 
                                            whiteSpace: "nowrap" 
                                        }}>
                                            {file.description}
                                        </div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InputFilePath() {
    const [isUploading, setIsUploading] = React.useState<boolean>(false);
    const [isLoadingExample, setIsLoadingExample] = React.useState<boolean>(false);

    const dispatch = useAppDispatch();
    const loadedFileNames = useAppSelector(selectBinaryFilePaths);
    const semanticCompareLeft = useAppSelector(selectSemanticCompareLeft);
    const semanticCompareRight = useAppSelector(selectSemanticCompareRight);

    // Sync Redux state with loaded files on component mount and when files change
    React.useEffect(() => {
        dispatch(syncWithLoadedFiles());
    }, [dispatch]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleFileUpload = async (files: FileList) => {
        if (!files) return;

        setIsUploading(true);

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                if (!file.name.endsWith('.disviz')) {
                    throw new Error(`Invalid file type: ${file.name}. Only .disviz files are supported.`);
                }
                const fileName = await disvizProcessor.loadDisvizFile(file);
                return fileName;
            });

            const loadedFileNames = await Promise.all(uploadPromises);

            // Sync with loaded files after upload
            dispatch(syncWithLoadedFiles());

            toast.success(`Loaded ${loadedFileNames.length} .disviz file(s)`);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Failed to load file(s): ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleLoadExample = async (fileName: string) => {
        setIsLoadingExample(true);
        
        try {
            // Fetch the example file from the public directory
            const response = await fetch(`/snapshots/${fileName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch example file: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: 'application/octet-stream' });
            
            const loadedFileName = await disvizProcessor.loadDisvizFile(file);
            
            // Sync with loaded files after loading example
            dispatch(syncWithLoadedFiles());
            
            toast.success(`Loaded example: ${loadedFileName}`);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Failed to load example file: ${errorMessage}`);
        } finally {
            setIsLoadingExample(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = loadedFileNames.indexOf(active.id as string);
            const newIndex = loadedFileNames.indexOf(over!.id as string);

            const newOrder = arrayMove(loadedFileNames, oldIndex, newIndex);
            
            // Update both disvizProcessor and Redux state
            disvizProcessor.reorderFiles(newOrder);
            dispatch(reorderBinaryFilePaths(newOrder));
        }
    };

    const handleDeleteFile = (fileName: string) => {
        // Redux action handles both processor and state removal
        dispatch(removeLoadedFile(fileName));
        toast.success(`Removed ${fileName}`);
    };

    const handleSemanticDiffDownload = () => {
        if (!semanticCompareLeft || !semanticCompareRight) return;
        const ld = disvizProcessor.getDisvizData(semanticCompareLeft);
        const rd = disvizProcessor.getDisvizData(semanticCompareRight);
        if (!ld || !rd) return;
        const doc = buildSemanticDiffDocument(semanticCompareLeft, semanticCompareRight, ld, rd);
        const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]+/g, '_');
        downloadSemanticDiffJson(doc, `semantic-diff_${safe(semanticCompareLeft)}_vs_${safe(semanticCompareRight)}.json`);
    };

    const leftHasSemantic = semanticCompareLeft
        ? extractSemanticBlob(disvizProcessor.getDisvizData(semanticCompareLeft) ?? {}) != null
        : false;
    const rightHasSemantic = semanticCompareRight
        ? extractSemanticBlob(disvizProcessor.getDisvizData(semanticCompareRight) ?? {}) != null
        : false;

    return (
        <div style={{ margin: "25px" }}>
            <div style={{ marginBottom: "30px" }}>
                <DropZone 
                    onFileUpload={handleFileUpload}
                    isUploading={isUploading}
                />
            </div>

            {loadedFileNames.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                    <div style={{
                        padding: "10px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef"
                    }} className="loaded-files-container">
                        <div style={{ 
                            fontSize: "12px", 
                            color: "#6c757d", 
                            marginBottom: "10px",
                            fontStyle: "italic"
                        }}>
                            Loaded Files ({loadedFileNames.length})
                        </div>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={loadedFileNames}
                                strategy={verticalListSortingStrategy}
                            >
                                {loadedFileNames.map((fileName, index) => (
                                    <SortableFileItem
                                        key={fileName}
                                        fileName={fileName}
                                        index={index}
                                        onDelete={handleDeleteFile}
                                        totalFiles={loadedFileNames.length}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            )}

            {loadedFileNames.length > 0 && (
                <Box
                    sx={{
                        mb: 2,
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                    }}
                >
                    <div style={{ fontSize: 12, color: '#586069', marginBottom: 8, fontWeight: 600 }}>
                        Semantic compare (left → right)
                    </div>
                    <div style={{ fontSize: 11, color: '#586069', marginBottom: 10 }}>
                        Disassembly highlights blocks when the open binary is the left or right side of this pair.
                    </div>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel id="inp-sem-left">Left</InputLabel>
                            <Select
                                labelId="inp-sem-left"
                                label="Left"
                                value={semanticCompareLeft}
                                onChange={(e) =>
                                    dispatch(
                                        setSemanticComparePair({
                                            left: e.target.value,
                                            right: semanticCompareRight,
                                        })
                                    )
                                }
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {loadedFileNames.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <span style={{ fontSize: 14, color: '#666' }}>→</span>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel id="inp-sem-right">Right</InputLabel>
                            <Select
                                labelId="inp-sem-right"
                                label="Right"
                                value={semanticCompareRight}
                                onChange={(e) =>
                                    dispatch(
                                        setSemanticComparePair({
                                            left: semanticCompareLeft,
                                            right: e.target.value,
                                        })
                                    )
                                }
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {loadedFileNames.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <MuiButton
                            variant="outlined"
                            size="small"
                            startIcon={<MdFileDownload size={18} />}
                            disabled={!semanticCompareLeft || !semanticCompareRight}
                            onClick={handleSemanticDiffDownload}
                        >
                            Download diff JSON
                        </MuiButton>
                    </Box>
                    {semanticCompareLeft && !leftHasSemantic && (
                        <MuiAlert severity="warning" sx={{ mt: 1, py: 0 }}>
                            Left file has no <code>semantic</code> section — re-export with current DisViz CLI.
                        </MuiAlert>
                    )}
                    {semanticCompareRight && !rightHasSemantic && (
                        <MuiAlert severity="warning" sx={{ mt: 1, py: 0 }}>
                            Right file has no <code>semantic</code> section — re-export with current DisViz CLI.
                        </MuiAlert>
                    )}
                    {loadedFileNames.length < 2 && (
                        <MuiAlert severity="info" sx={{ mt: 1, py: 0 }}>
                            Load two binaries to set a compare pair.
                        </MuiAlert>
                    )}
                </Box>
            )}

            <ExampleFiles 
                onLoadExample={handleLoadExample}
                isLoading={isLoadingExample}
            />

            {loadedFileNames.length === 0 && (
                <Alert variant="info" style={{ 
                    border: "none",
                    backgroundColor: "#e3f2fd",
                    color: "#1565c0",
                    borderRadius: "8px"
                }}>
                    <MdUpload style={{ marginRight: "8px" }} />
                    Upload .disviz files above or try the example files to begin your binary analysis
                </Alert>
            )}
        </div>
    );
}

export default InputFilePath