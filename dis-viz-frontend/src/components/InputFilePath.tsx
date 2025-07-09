import React from 'react'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import 'bootstrap/dist/css/bootstrap.min.css'
import * as disvizProcessor from "../disvizProcessor"
import '../styles/inputsourcefilepath.css'
import { 
    reorderBinaryFilePaths, 
    removeLoadedFile, 
    syncWithLoadedFiles 
} from '../features/binary-data/binaryDataSlice'
import { useAppDispatch } from '../app/hooks'
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
import { MdDragIndicator, MdDelete, MdUpload, MdCloudUpload } from 'react-icons/md'

interface SortableFileItemProps {
    fileName: string;
    index: number;
    onDelete: (fileName: string) => void;
}

function SortableFileItem({ fileName, index, onDelete }: SortableFileItemProps) {
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
    const totalFiles = disvizProcessor.getLoadedFileNames().length;
    const row = (index % 2) + 1;
    const col = Math.floor(index / 2) + 1;
    const totalColumns = Math.ceil(totalFiles / 2);

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

function InputFilePath() {
    const [isUploading, setIsUploading] = React.useState<boolean>(false);

    const dispatch = useAppDispatch();
    const loadedFileNames = disvizProcessor.getLoadedFileNames();

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
        dispatch(removeLoadedFile(fileName));
        toast.success(`Removed ${fileName}`);
    };

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
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            )}

            {loadedFileNames.length === 0 && (
                <Alert variant="info" style={{ 
                    border: "none",
                    backgroundColor: "#e3f2fd",
                    color: "#1565c0",
                    borderRadius: "8px"
                }}>
                    <MdUpload style={{ marginRight: "8px" }} />
                    Upload .disviz files above to begin your binary analysis
                </Alert>
            )}
        </div>
    );
}

export default InputFilePath