import { Component, ComponentChild } from 'preact';
import { style } from 'typestyle';
import { Cogs } from '../service/cogs';

const CogCss = {
    container: style({}),
    input: {
        container: style({ display: 'flex', width: '80%', maxWidth: '800px', justifyContent: 'flex-end' }),
    },
};

export class CogAdd extends Component<{ defaultUrl: string }, { value?: string }> {
    get url(): string {
        return this.state.value ?? this.props.defaultUrl;
    }

    render(): ComponentChild {
        const text = this.url;
        return (
            <div className={CogCss.input.container}>
                <input
                    id="cog__input"
                    style={{ width: '80%' }}
                    type="url"
                    onInput={this.onInput}
                    placeholder="https://example.com/cog.tiff"
                    value={text}
                />
                <input type="submit" onClick={this.onAddCog} value="Add Cog" />
            </div>
        );
    }

    validateInput(text?: string, required = false): string | undefined {
        if (required && text == null) return 'Missing URL';
        if (text == null) return;
        if (!text.startsWith('http')) return 'URL must start with http';
    }

    onAddCog = (): false => {
        if (this.url == null) return false;
        if (this.validateInput(this.url)) return false;
        Cogs.add(this.url);
        return false;
    };

    onInput = (el: Event): void => {
        if (!(el.target instanceof HTMLInputElement)) return;
        this.setState({ ...this.state, value: el.target.value });
    };
}
