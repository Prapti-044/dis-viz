import React from 'react';
import { Menu, SubMenu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
    toggleTag,
    selectAllTagStates,
    selectShowOnlyDifferingTags,
    toggleShowOnlyDifferingTags,
    selectDimSameTags,
    toggleDimSameTags
} from '../features/tags/tagsSlice';
import { SOURCE_TAGS, INSTRUCTION_TAGS } from '../utils';

import '../styles/headerMenu.css';

interface HeaderMenuProps {
    showMinimaps: boolean;
    setShowMinimaps: React.Dispatch<React.SetStateAction<boolean>>;
    onAddCallGraphView: () => void;
    onOpenSemanticDiff: () => void;
}



const HeaderMenu: React.FC<HeaderMenuProps> = ({
    showMinimaps,
    setShowMinimaps,
    onAddCallGraphView,
    onOpenSemanticDiff,
}) => {
    const dispatch = useAppDispatch();
    const enabledTags = useAppSelector(selectAllTagStates);
    const showOnlyDifferingTags = useAppSelector(selectShowOnlyDifferingTags);
    const dimSameTags = useAppSelector(selectDimSameTags);

    return (
        <div className="header-menu">
            <div className="app-logo">
                <span className="logo-text">DIS-VIZ</span>
            </div>
            <div className="menu-container">
                <Menu menuButton={<MenuButton className="header-menu-button">File</MenuButton>} transition>
                    <MenuItem className="header-menu-item">New File</MenuItem>
                    <SubMenu label="Edit" className="header-menu-item">
                        <MenuItem className="header-menu-item">Cut</MenuItem>
                        <MenuItem className="header-menu-item">Copy</MenuItem>
                        <MenuItem className="header-menu-item">Paste</MenuItem>
                        <SubMenu label="Find" className="header-menu-item">
                            <MenuItem className="header-menu-item">Find...</MenuItem>
                            <MenuItem className="header-menu-item">Find Next</MenuItem>
                            <MenuItem className="header-menu-item">Find Previous</MenuItem>
                        </SubMenu>
                    </SubMenu>
                    <MenuItem className="header-menu-item">Print...</MenuItem>
                </Menu>
                <Menu menuButton={<MenuButton className="header-menu-button">View</MenuButton>} transition>
                    <MenuItem 
                        className="header-menu-item"
                        onClick={(e) => {
                            setShowMinimaps(!showMinimaps);
                            // Stop propagation and keep menu open
                            e.stopPropagation = true;
                            e.keepOpen = true;
                        }}
                    >
                        <div className="checkbox-menu-item">
                            <input type="checkbox" checked={showMinimaps} readOnly />
                            <span>Show Minimaps</span>
                        </div>
                    </MenuItem>
                    <MenuItem
                        className="header-menu-item"
                        onClick={(e) => {
                            dispatch(toggleShowOnlyDifferingTags());
                            // Stop propagation and keep menu open
                            e.stopPropagation = true;
                            e.keepOpen = true;
                        }}
                    >
                        <div className="checkbox-menu-item">
                            <input type="checkbox" checked={showOnlyDifferingTags} readOnly />
                            <span>Show Only Differing Tags</span>
                        </div>
                    </MenuItem>
                    <MenuItem
                        className="header-menu-item"
                        onClick={(e) => {
                            dispatch(toggleDimSameTags());
                            // Stop propagation and keep menu open
                            e.stopPropagation = true;
                            e.keepOpen = true;
                        }}
                    >
                        <div className="checkbox-menu-item">
                            <input type="checkbox" checked={dimSameTags} readOnly />
                            <span>Dim the Same Tags</span>
                        </div>
                    </MenuItem>
                    <MenuItem 
                        className="header-menu-item"
                        onClick={onAddCallGraphView}
                    >
                        Add Call Tree
                    </MenuItem>
                    <MenuItem className="header-menu-item" onClick={onOpenSemanticDiff}>
                        Semantic diff…
                    </MenuItem>
                    <SubMenu label="Tags" className="header-menu-item">
                        {[...SOURCE_TAGS, ...INSTRUCTION_TAGS]
                            .filter((tag, index, self) =>
                                index === self.findIndex(t => t.id === tag.id)
                            )
                            .map(tag => (
                                <MenuItem 
                                    key={tag.id}
                                    className="header-menu-item"
                                    onClick={(e) => {
                                        dispatch(toggleTag(tag.id));
                                        // Stop propagation and keep menu open
                                        e.stopPropagation = true;
                                        e.keepOpen = true;
                                    }}
                                >
                                    <div className="checkbox-menu-item tag-item" style={{ color: tag.color }}>
                                        <input type="checkbox" checked={enabledTags[tag.id]} readOnly />
                                        <span>{tag.fullName}</span>
                                    </div>
                                </MenuItem>
                            ))}
                    </SubMenu>
                </Menu>
            </div>
        </div>
    );
};

export default HeaderMenu;