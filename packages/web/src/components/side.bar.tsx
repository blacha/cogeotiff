import { ComponentChild } from 'preact';
import { style } from 'typestyle';

export const SideBarCss = {
    container: style({ minWidth: '300px' }),
    group: style({}),
    groupTile: style({ fontSize: '120%', marginBottom: '16px' }),
    groupItem: style({ padding: '2px 8px', fontSize: '80%', display: 'flex', justifyContent: 'space-between' }),
    groupItemLabel: style({ fontWeight: 'bold' }),
    groupItemValue: style({
        $nest: {
            button: {
                padding: '8px',
            },
        },
    }),
};
export const SideBar = {
    renderLine(title: string, value: string | ComponentChild): ComponentChild {
        return (
            <div class={SideBarCss.groupItem}>
                <label class={SideBarCss.groupItemLabel}>{title}</label>
                <div class={SideBarCss.groupItemValue}>{value}</div>
            </div>
        );
    },
};
