import { Component, ComponentChild } from 'preact';
import { style } from 'typestyle';
const Css = {
    container: style({
        fontFamily: 'Material Icons',
        padding: 4,
        width: 32,
        height: 32,
    }),
};

export enum MaterialIcon {
    Delete = 'delete',
    ArrowDown = 'keyboard_arrow_down',
    ArrowUp = 'keyboard_arrow_up',
}

interface IconButtonProps {
    icon: MaterialIcon;
    onClick: () => void;
    title: string;
    disabled?: boolean;
}
export class IconButton extends Component<IconButtonProps> {
    render(p: IconButtonProps): ComponentChild {
        return (
            <button onClick={p.onClick} title={p.title} className={Css.container} disabled={p.disabled ?? false}>
                {p.icon}
            </button>
        );
    }
}
