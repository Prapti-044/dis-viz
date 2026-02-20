import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useAppSelector } from '../store/hooks';
import { selectSourceSelection } from '../features/selections/selectionsSlice';
import { selectBinaryFilePaths } from '../features/binary-data/binaryDataSlice';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem, TreeItemProps, treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { 
    Box, 
    IconButton, 
    Tooltip, 
    Stack, 
    FormControl, 
    Select, 
    MenuItem, 
    InputLabel,
    Typography,
    Chip,
    SelectChangeEvent,
    Divider
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { HIGHLIGHT_COLOR, SOURCE_TAGS } from '../utils';
import * as disvizProcessor from '../disvizProcessor';

// Import custom file type icons
import hppIcon from '../assets/icons/hpp.png';
import headerIcon from '../assets/icons/header.png';
import cppIcon from '../assets/icons/C++.png';
import cIcon from '../assets/icons/C.png';

// Types
interface FileType {
    name: string;
    fullPath: string;
    type: "file" | "directory";
    subdir: FileType[] | null;
    status: "closed" | "opened";
}

interface TagCountInfo {
    [binaryPath: string]: { count: number; lines: number[] };
}

// Utility functions
const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconStyle = { width: 16, height: 16 };
    switch (ext) {
        case 'hpp': return <img src={hppIcon.src} alt="HPP" style={iconStyle} />;
        case 'h': return <img src={headerIcon.src} alt="Header" style={iconStyle} />;
        case 'cpp': case 'cxx': case 'cc': return <img src={cppIcon.src} alt="C++" style={iconStyle} />;
        case 'c': return <img src={cIcon.src} alt="C" style={iconStyle} />;
        default: return <InsertDriveFileIcon />;
    }
};

const getTagInfo = (tagId: string) => {
    const tag = SOURCE_TAGS.find(t => t.id === tagId);
    return { color: tag?.color || '#e0e0e0', shortName: tag?.shortName || tagId.slice(0, 3) };
};

const arraysEqual = (a: number[], b: number[]): boolean => {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    return b.every(item => setA.has(item));
};

// Tag count badge component
const TagCountBadge = React.memo(({ counts, binaryPaths, tagId }: { 
    counts: TagCountInfo; 
    binaryPaths: string[];
    tagId: string;
}) => {
    const { color, shortName } = getTagInfo(tagId);
    const isMultiBinary = binaryPaths.length > 1;
    
    const binaryData = binaryPaths.map(path => ({
        path,
        count: counts[path]?.count || 0,
        lines: counts[path]?.lines || [],
    }));
    
    const totalCount = binaryData.reduce((sum, b) => sum + b.count, 0);
    if (totalCount === 0) return null;
    
    // Detect if same count but different lines across binaries
    let linesDiffer = false;
    if (isMultiBinary) {
        const allSame = new Set(binaryData.map(b => b.count)).size === 1;
        if (allSame && binaryData[0].count > 0 && binaryData.slice(1).some(b => !arraysEqual(binaryData[0].lines, b.lines))) {
            linesDiffer = true;
        }
    }
    
    const chipStyle = {
        height: 18,
        minWidth: 24,
        fontSize: '10px',
        fontWeight: 'bold',
        backgroundColor: 'transparent',
        border: `1.5px solid ${color}`,
        color: 'black',
        '& .MuiChip-label': { padding: '0 4px' },
    };

    if (!isMultiBinary) {
        return (
            <Tooltip title={`${totalCount} ${shortName} tags`} arrow>
                <Chip size="small" label={totalCount} sx={{ ...chipStyle, '& .MuiChip-label': { padding: '0 6px' } }} />
            </Tooltip>
        );
    }

    const allSameCount = new Set(binaryData.map(b => b.count)).size === 1;

    if (allSameCount) {
        return (
            <Tooltip title={linesDiffer ? 'Same count, different lines' : `${binaryData[0].count} ${shortName} tags (all binaries)`} arrow>
                <Chip size="small" label={binaryData[0].count} sx={{ 
                    ...chipStyle, 
                    ...(linesDiffer && { border: '2px solid #9c27b0' }),
                    '& .MuiChip-label': { padding: '0 6px' },
                }} />
            </Tooltip>
        );
    }

    return (
        <Box sx={{ display: 'flex', gap: '2px' }}>
            {binaryData.map((binary) => (
                <Tooltip key={binary.path} title={`${binary.path}: ${binary.count}`} arrow>
                    <Chip
                        size="small"
                        label={binary.count}
                        sx={{
                            ...chipStyle,
                            opacity: binary.count === 0 ? 0.3 : 1,
                        }}
                    />
                </Tooltip>
            ))}
        </Box>
    );
});
TagCountBadge.displayName = 'TagCountBadge';

// Styled TreeItem
const StyledTreeItem = styled(TreeItem, {
    shouldForwardProp: (prop) => !['isSelected', 'fileType', 'isOpened'].includes(prop as string),
})<TreeItemProps & { isSelected?: boolean; fileType?: "file" | "directory"; isOpened?: boolean }>(
    ({ theme, isSelected, fileType, isOpened }) => ({
        [`& .${treeItemClasses.content}`]: {
            backgroundColor: isSelected ? HIGHLIGHT_COLOR : 'transparent',
            borderRadius: '4px',
            padding: theme.spacing(0.3, 1),
            margin: theme.spacing(0.1, 0),
            border: isOpened ? '1px solid #2196f3' : '1px solid transparent',
            '&:hover': { backgroundColor: isSelected ? HIGHLIGHT_COLOR : 'rgba(0, 0, 0, 0.04)' },
        },
        [`& .${treeItemClasses.iconContainer}`]: { marginRight: fileType === 'directory' ? '8px' : '0px' },
        [`& .${treeItemClasses.label}`]: {
            fontSize: '13px',
            fontWeight: fileType === 'directory' ? 'normal' : 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        [`& .${treeItemClasses.groupTransition}`]: {
            marginLeft: 15,
            paddingLeft: 18,
            borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
        },
    })
);

// Custom TreeItem
const CustomTreeItem = React.memo(React.forwardRef<HTMLLIElement, TreeItemProps & { 
    fileType?: "file" | "directory"; 
    isSelected?: boolean; 
    isOpened?: boolean;
    isExpanded?: boolean;
    fileName?: string;
    tagCounts?: TagCountInfo;
    selectedTag?: string;
    binaryPaths?: string[];
}>((props, ref) => {
    const { fileType, isSelected, isOpened, isExpanded, fileName, tagCounts, selectedTag, binaryPaths, label, ...other } = props;

    const icon = useMemo(() => {
        if (fileType === 'directory') return isExpanded ? <FolderOpenIcon /> : <FolderIcon />;
        return fileName ? getFileIcon(fileName) : <InsertDriveFileIcon />;
    }, [fileType, isExpanded, fileName]);

    const labelContent = (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
            <Typography component="span" sx={{ 
                fontSize: '13px', 
                fontWeight: fileType === 'directory' ? 'normal' : 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flexGrow: 1,
                minWidth: 0,
            }}>
                {label}
            </Typography>
            {fileType === 'file' && selectedTag && tagCounts && binaryPaths && (
                <TagCountBadge counts={tagCounts} binaryPaths={binaryPaths} tagId={selectedTag} />
            )}
        </Box>
    );

    return (
        <StyledTreeItem
            ref={ref}
            {...other}
            label={labelContent}
            isSelected={isSelected}
            fileType={fileType}
            isOpened={isOpened}
            slots={{ icon: () => icon }}
        />
    );
}));
CustomTreeItem.displayName = 'CustomTreeItem';

// Tag selector
const TagSelector = React.memo(({ selectedTag, onTagChange }: { selectedTag: string; onTagChange: (tag: string) => void }) => (
    <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel sx={{ fontSize: '12px' }}>Tag Filter</InputLabel>
        <Select
            value={selectedTag}
            label="Tag Filter"
            onChange={(e: SelectChangeEvent) => onTagChange(e.target.value)}
            sx={{ fontSize: '12px', '& .MuiSelect-select': { py: 0.75 } }}
        >
            <MenuItem value=""><em>None</em></MenuItem>
            <Divider />
            {SOURCE_TAGS.map(tag => (
                <MenuItem key={tag.id} value={tag.id} sx={{ fontSize: '12px', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: tag.color, border: '1px solid rgba(0,0,0,0.2)' }} />
                    {tag.fullName}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
));
TagSelector.displayName = 'TagSelector';

// Build file tree structure
const buildFileTree = (sourceViewData: { file_name: string; status: "opened" | "closed" }[]) => {
    const root: FileType = { name: '/', fullPath: "/", type: "directory", subdir: [], status: "opened" };

    sourceViewData.forEach(({ file_name, status }) => {
        let current = root;
        const parts = file_name.split("/").slice(1);
        
        parts.forEach((part, i) => {
            const isFile = i === parts.length - 1;
            const fullPath = "/" + parts.slice(0, i + 1).join('/');
            
            if (isFile) {
                current.subdir!.push({ name: part, fullPath, type: "file", subdir: null, status });
            } else {
                let existing = current.subdir?.find(d => d.name === part);
                if (!existing) {
                    existing = { name: part, fullPath, type: "directory", subdir: [], status: "opened" };
                    current.subdir!.push(existing);
                }
                current = existing;
            }
        });
    });

    // Simplify nested single directories
    const simplify = (node: FileType) => {
        if (node.type === 'file') return;
        while (node.subdir?.length === 1 && node.subdir[0].type !== 'file') {
            const child = node.subdir[0];
            node.name = node.name + '/' + child.name;
            node.fullPath = child.fullPath;
            node.subdir = child.subdir;
        }
        node.subdir?.forEach(simplify);
    };
    simplify(root);

    // Build metadata and collect directory IDs
    const metadataMap = new Map<string, { type: "file" | "directory"; status: "opened" | "closed" }>();
    const directoryIds: string[] = [];
    
    const traverse = (node: FileType) => {
        metadataMap.set(node.fullPath, { type: node.type, status: node.status });
        if (node.type === 'directory') directoryIds.push(node.fullPath);
        node.subdir?.forEach(traverse);
    };
    traverse(root);

    const toTreeItems = (node: FileType): TreeViewBaseItem => ({
        id: node.fullPath,
        label: node.name,
        children: node.subdir?.map(toTreeItems),
    });

    return {
        items: root.subdir?.map(toTreeItems) || [],
        metadataMap,
        directoryIds,
    };
};

// Main component
function SourceFileTree({ sourceViewData, setSourceViewData }: {
    sourceViewData: { file_name: string; status: "opened" | "closed" }[];
    setSourceViewData: (data: { file_name: string; status: "opened" | "closed" }[]) => void;
}) {
    const selectedFiles = useAppSelector(selectSourceSelection).map(f => f.source_file);
    const binaryPaths = useAppSelector(selectBinaryFilePaths).filter(f => f !== '');
    const [selectedTag, setSelectedTag] = useState('');
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Build tree structure
    const { items, metadataMap, directoryIds } = useMemo(
        () => buildFileTree(sourceViewData), 
        [sourceViewData]
    );

    // Fetch tag counts
    const tagData = useMemo(
        () => binaryPaths.length > 0 ? disvizProcessor.getAllSourceFileTagCounts(binaryPaths) : {},
        [binaryPaths]
    );

    // Get tag counts for a file
    const getTagCounts = useCallback((filePath: string): TagCountInfo => {
        if (!selectedTag || !tagData[filePath]) return {};
        return Object.fromEntries(
            binaryPaths.map(bp => [bp, {
                count: tagData[filePath][bp]?.counts?.[selectedTag] || 0,
                lines: tagData[filePath][bp]?.lines?.[selectedTag] || []
            }])
        );
    }, [tagData, selectedTag, binaryPaths]);

    // Auto-expand directories on load
    useEffect(() => { setExpandedItems(directoryIds); }, [directoryIds.join(',')]);

    // Handle file click
    const handleItemClick = useCallback((e: React.SyntheticEvent, itemId: string) => {
        const idx = sourceViewData.findIndex(d => d.file_name === itemId);
        if (idx !== -1 && !itemId.endsWith('/')) {
            const updated = [...sourceViewData];
            updated[idx] = { ...updated[idx], status: updated[idx].status === "opened" ? "closed" : "opened" };
            setSourceViewData(updated);
        }
    }, [sourceViewData, setSourceViewData]);

    // Tree slots
    const treeSlots = useMemo(() => ({
        item: (props: any) => {
            const meta = metadataMap.get(props.itemId);
            return (
                <CustomTreeItem
                    {...props}
                    fileType={meta?.type}
                    isSelected={selectedFiles.includes(props.itemId)}
                    isOpened={sourceViewData.find(d => d.file_name === props.itemId)?.status === "opened"}
                    isExpanded={expandedItems.includes(props.itemId)}
                    fileName={props.itemId.split('/').pop() || ''}
                    tagCounts={meta?.type === 'file' ? getTagCounts(props.itemId) : undefined}
                    selectedTag={selectedTag}
                    binaryPaths={binaryPaths}
                />
            );
        },
    }), [metadataMap, selectedFiles, sourceViewData, expandedItems, getTagCounts, selectedTag, binaryPaths]);

    return (
        <Box sx={{ minHeight: 200, flexGrow: 1, maxWidth: 450, display: 'flex', flexDirection: 'column' }}>
            {/* Controls */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1, py: 1, borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                <TagSelector selectedTag={selectedTag} onTagChange={setSelectedTag} />
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Expand All">
                    <IconButton size="small" onClick={() => setExpandedItems(directoryIds)}>
                        <UnfoldMoreIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Collapse All">
                    <IconButton size="small" onClick={() => setExpandedItems([])}>
                        <UnfoldLessIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Tree */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
                <RichTreeView
                    items={items}
                    onItemClick={handleItemClick}
                    expandedItems={expandedItems}
                    onExpandedItemsChange={(_, ids) => setExpandedItems(ids)}
                    slots={treeSlots}
                    sx={{ overflowX: 'hidden' }}
                />
            </Box>
        </Box>
    );
}

export default React.memo(SourceFileTree);
