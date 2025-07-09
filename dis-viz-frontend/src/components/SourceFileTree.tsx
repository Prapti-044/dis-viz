import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useAppSelector } from '../app/hooks';
import { selectSourceSelection } from '../features/selections/selectionsSlice';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem, TreeItemProps, treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { Box, IconButton, Tooltip, Stack } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StarIcon from '@mui/icons-material/Star';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { HIGHLIGHT_COLOR } from '../utils';

// Import custom file type icons
import hppIcon from '../assets/icons/hpp.png';
import headerIcon from '../assets/icons/header.png';
import cppIcon from '../assets/icons/C++.png';
import cIcon from '../assets/icons/C.png';

type FileType = {
    name: string,
    fullPath: string,
    type: "file" | "directory",
    subdir: FileType[] | null,
    status: "closed" | "opened"
}

// Convert FileType to TreeViewBaseItem format
const convertToTreeItem = (file: FileType): TreeViewBaseItem => {
    return {
        id: file.fullPath,
        label: file.name,
        children: file.subdir ? file.subdir.map(child => convertToTreeItem(child)) : undefined,
    };
};

// Function to get file icon based on extension
const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'hpp':
            return <img src={hppIcon} alt="HPP file" style={{ width: 16, height: 16 }} />;
        case 'h':
            return <img src={headerIcon} alt="Header file" style={{ width: 16, height: 16 }} />;
        case 'cpp':
        case 'cxx':
        case 'cc':
            return <img src={cppIcon} alt="C++ file" style={{ width: 16, height: 16 }} />;
        case 'c':
            return <img src={cIcon} alt="C file" style={{ width: 16, height: 16 }} />;
        default:
            return <InsertDriveFileIcon />; // Default icon for files without specific extensions
    }
};

// Styled TreeItem with vertical lines and proper hover behavior
const StyledTreeItem = styled(TreeItem)<TreeItemProps & { 
    isSelected?: boolean; 
    fileType?: "file" | "directory"; 
    isOpened?: boolean;
}>(({ theme, isSelected, fileType, isOpened }) => ({
    [`& .${treeItemClasses.content}`]: {
        backgroundColor: isSelected ? HIGHLIGHT_COLOR : 'transparent',
        borderRadius: '4px',
        padding: theme.spacing(0.3, 1),
        margin: theme.spacing(0.1, 0),
        display: 'flex',
        alignItems: 'center',
        border: isOpened ? '1px solid #2196f3' : '1px solid transparent',
        '&:hover': {
            backgroundColor: isSelected ? HIGHLIGHT_COLOR : 'rgba(0, 0, 0, 0.04)',
        },
        '&.Mui-selected': {
            backgroundColor: isSelected ? HIGHLIGHT_COLOR : 'rgba(25, 118, 210, 0.12)',
        },
    },
    [`& .${treeItemClasses.iconContainer}`]: {
        marginRight: fileType === 'directory' ? '12px' : '0px',
    },
    [`& .${treeItemClasses.label}`]: {
        fontSize: '14px',
        fontWeight: fileType === 'directory' ? 'normal' : 'bold',
    },
    [`& .${treeItemClasses.groupTransition}`]: {
        marginLeft: 15,
        paddingLeft: 18,
        borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
}));

// Memoized Custom TreeItem component with icons and highlighting
const CustomTreeItem = React.memo(React.forwardRef<HTMLLIElement, TreeItemProps & { 
    fileType?: "file" | "directory"; 
    isSelected?: boolean; 
    isOpened?: boolean;
    isExpanded?: boolean;
    hasChildren?: boolean;
    fileName?: string;
}>((props, ref) => {
    const { fileType, isSelected, isOpened, isExpanded, hasChildren, fileName, ...other } = props;

    const icon = useMemo(() => {
        if (fileType === 'directory') {
            return isExpanded ? <FolderOpenIcon /> : <FolderIcon />;
        }
        return fileName ? getFileIcon(fileName) : <InsertDriveFileIcon />;
    }, [fileType, isExpanded, fileName]);

    const endIcon = useMemo(() => {
        if (isSelected && fileType === 'file') {
            return <StarIcon color="primary" />;
        }
        return null;
    }, [isSelected, fileType]);

    return (
        <StyledTreeItem
            ref={ref}
            {...other}
            isSelected={isSelected}
            fileType={fileType}
            isOpened={isOpened}
            slots={{
                icon: () => icon,
                endIcon: () => endIcon,
            }}
        />
    );
}));

CustomTreeItem.displayName = 'CustomTreeItem';

function SourceFileTree({ sourceViewData, setSourceViewData }:{
    sourceViewData: { file_name: string, status: "opened" | "closed" }[],
    setSourceViewData: (_: { file_name: string, status: "opened" | "closed" }[]) => void,
}) {
    const selectedFiles = useAppSelector(selectSourceSelection).map(file => file.source_file)
    
    const handleItemClick = useCallback((event: React.SyntheticEvent, itemId: string) => {
        // Find the file in sourceViewData and check if it's a file (not directory)
        const fileData = sourceViewData.find(data => data.file_name === itemId);
        if (fileData && !itemId.endsWith('/')) {
            const sourceViewDataCopy = [...sourceViewData];
            const index = sourceViewDataCopy.findIndex(sourceData => sourceData.file_name === itemId);
            if (index !== -1) {
                // Toggle the status: if opened, close it; if closed, open it
                sourceViewDataCopy[index].status = sourceViewDataCopy[index].status === "opened" ? "closed" : "opened";
                setSourceViewData(sourceViewDataCopy);
            }
        }
    }, [sourceViewData, setSourceViewData]);

    // Build the file tree structure - memoized to avoid rebuilding on every render
    const { items, fileMetadataMap, allDirectoryIds } = useMemo(() => {
        const rootFile: FileType = {
            name: '/',
            fullPath: "/",
            type: "directory",
            subdir: [],
            status: "opened"
        }

        sourceViewData.forEach(({ file_name, status }) => {
            let currentLoc = rootFile
            const list = file_name.split("/").slice(1)
            list.forEach((fileOrFolder, i) => {
                const isFile = i === list.length-1
                if (isFile) {
                    const newDir: FileType = {
                        name: fileOrFolder,
                        fullPath: "/"+list.slice(0,i+1).join('/'),
                        type: "file",
                        subdir: null,
                        status: status,
                    }
                    currentLoc.subdir!.push(newDir)
                }
                else {
                    if(currentLoc.subdir?.map(dir => dir.name).includes(fileOrFolder)) {
                        currentLoc = currentLoc.subdir.find(dir => dir.name === fileOrFolder)!
                    }
                    else {
                        const newDir: FileType = {
                            name: fileOrFolder,
                            fullPath: "/"+list.slice(0,i+1).join('/'),
                            type: "directory",
                            subdir: [],
                            status: "opened",
                        }
                        currentLoc.subdir!.push(newDir)
                        currentLoc = newDir
                    }
                }
            })
        })

        // Simplify the nested single directories
        function simplifyStructure(root: FileType) {
            if (root.type === 'file') return
            while(root.subdir && root.subdir.length === 1 && root.subdir[0].type !== 'file') {
                root.name = root.name + '/' + root.subdir[0].name
                root.fullPath = root.subdir[0].fullPath
                root.status = root.subdir[0].status
                root.type = root.subdir[0].type
                root.subdir = root.subdir[0].subdir
            }

            root.subdir?.forEach(file => {
                simplifyStructure(file)
            })
        }
        simplifyStructure(rootFile);

        // Convert to tree items and create lookup for file metadata
        const createItemsWithMetadata = (file: FileType): TreeViewBaseItem[] => {
            if (!file.subdir) return [];
            
            return file.subdir.map(child => convertToTreeItem(child));
        };

        // Create metadata lookup for custom tree items
        const createFileMetadataMap = (file: FileType, map: Map<string, { type: "file" | "directory"; status: "opened" | "closed" }> = new Map()) => {
            map.set(file.fullPath, { type: file.type, status: file.status });
            if (file.subdir) {
                file.subdir.forEach(child => createFileMetadataMap(child, map));
            }
            return map;
        };

        // Collect all directory IDs for auto-expansion
        const getAllDirectoryIds = (file: FileType, dirIds: string[] = []): string[] => {
            if (file.type === 'directory') {
                dirIds.push(file.fullPath);
            }
            if (file.subdir) {
                file.subdir.forEach(child => getAllDirectoryIds(child, dirIds));
            }
            return dirIds;
        };

        const items = createItemsWithMetadata(rootFile);
        const fileMetadataMap = createFileMetadataMap(rootFile);
        const allDirectoryIds = getAllDirectoryIds(rootFile);

        return { items, fileMetadataMap, allDirectoryIds };
    }, [sourceViewData]);

    // State to manage expanded items
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Update expanded items when directory structure changes - use a ref to avoid infinite loops
    const prevDirectoryIds = useMemo(() => allDirectoryIds.join(','), [allDirectoryIds]);
    
    useEffect(() => {
        setExpandedItems(allDirectoryIds);
    }, [prevDirectoryIds, allDirectoryIds]);

    const handleExpandedItemsChange = useCallback((event: React.SyntheticEvent | null, itemIds: string[]) => {
        setExpandedItems(itemIds);
    }, []);

    // Expand/Collapse all handlers
    const handleExpandAll = useCallback(() => {
        setExpandedItems(allDirectoryIds);
    }, [allDirectoryIds]);

    const handleCollapseAll = useCallback(() => {
        setExpandedItems([]);
    }, []);

    // Helper function to check if an item has children
    const hasChildren = useCallback((itemId: string): boolean => {
        const findItem = (items: TreeViewBaseItem[]): boolean => {
            for (const item of items) {
                if (item.id === itemId) {
                    return !!(item.children && item.children.length > 0);
                }
                if (item.children) {
                    const found = findItem(item.children);
                    if (found !== false) return found;
                }
            }
            return false;
        };
        return findItem(items);
    }, [items]);

    // Memoized slots to prevent recreation on every render
    const treeSlots = useMemo(() => ({
        item: (itemProps: any) => {
            const metadata = fileMetadataMap.get(itemProps.itemId);
            const isSelected = selectedFiles.includes(itemProps.itemId);
            const isOpened = sourceViewData.find(data => data.file_name === itemProps.itemId)?.status === "opened";
            const isExpanded = expandedItems.includes(itemProps.itemId);
            const itemHasChildren = hasChildren(itemProps.itemId);
            
            // Extract filename from the full path for icon determination
            const fileName = itemProps.itemId.split('/').pop() || '';
            
            return (
                <CustomTreeItem
                    {...itemProps}
                    fileType={metadata?.type}
                    isSelected={isSelected}
                    isOpened={isOpened}
                    isExpanded={isExpanded}
                    hasChildren={itemHasChildren}
                    fileName={fileName}
                />
            );
        },
    }), [fileMetadataMap, selectedFiles, sourceViewData, expandedItems, hasChildren]);

    return (
        <Box sx={{ minHeight: 200, flexGrow: 1, maxWidth: 400 }}>
            {/* Expand/Collapse Controls */}
            <Stack 
                direction="row" 
                spacing={1} 
                sx={{ 
                    mb: 1, 
                    px: 1,
                    borderBottom: '1px solid #eee',
                    pb: 1
                }}
            >
                <Tooltip title="Expand All">
                    <IconButton 
                        size="small" 
                        onClick={handleExpandAll}
                        sx={{ 
                            '&:hover': { 
                                backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                            } 
                        }}
                    >
                        <UnfoldMoreIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Collapse All">
                    <IconButton 
                        size="small" 
                        onClick={handleCollapseAll}
                        sx={{ 
                            '&:hover': { 
                                backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                            } 
                        }}
                    >
                        <UnfoldLessIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Tree View */}
            <RichTreeView
                items={items}
                onItemClick={handleItemClick}
                itemChildrenIndentation={20}
                expandedItems={expandedItems}
                onExpandedItemsChange={handleExpandedItemsChange}
                slots={treeSlots}
                sx={{ overflowX: 'hidden' }}
            />
        </Box>
    );
}

export default React.memo(SourceFileTree);