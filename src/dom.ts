
/** Returns the name of a function, if available */
function name(fn: Function): string {
    if ( (<any> fn).name ) {
        return (<any> fn).name;
    }
    else {
        var ret = fn.toString().substr("function ".length);
        ret = ret.substr(0, ret.indexOf("("));
        return ret;
    }
}

/** A custom version of window to add missing declarations */
interface CustomWindow extends Window {
    HTMLElement: HTMLElement;
    HTMLInputElement: HTMLInputElement;
}

/** Extra modifiers for key events */
interface KeyModifiers {
    alt?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
}

/** A single dom element */
class Elem {

    /** The document that owns this node */
    doc: Document;

    /** The window object */
    win: CustomWindow;

    /** The html element being wrapped */
    constructor (public elem: Node) {
        this.doc = this.elem.ownerDocument;
        this.win = <CustomWindow> this.doc.defaultView;
    }

    /** Converts the element to the given type */
    private as<T> ( typename: any ): T {
        if ( this.elem instanceof typename ) {
            return <any> this.elem;
        }
        else {
            throw new Error("Element is not a " + name(typename));
        }
    }

    /** Returns text content */
    public text(): string {
        return this.elem.textContent;
    }

    /** Returns whether an element has a class */
    public hasClass( klass: string ): boolean {
        var elem = this.as<HTMLElement>(HTMLElement);
        return elem.className.split(" ").indexOf(klass) !== -1;
    }

    /** Triggers a click event */
    public click (): void {
        var clickevent = this.doc.createEvent("MouseEvents");
        clickevent.initEvent("click", true, true);
        this.elem.dispatchEvent(clickevent);
    }

    /** Returns the calculated CSS styles */
    public styles(): CSSStyleDeclaration {
        var elem = this.as<HTMLElement>(this.win.HTMLElement);
        return this.win.getComputedStyle(elem);
    }

    /** Returns whether an element is visible */
    public isVisible (): boolean {
        return this.styles().display !== "none";
    }

    /** Triggers a keyboard based event */
    private keyEvent (
        eventType: string,
        keyCode: number,
        mods: KeyModifiers
    ): void {
        var event = this.doc.createEvent("KeyboardEvent");

        if ( (<any> event).initKeyEvent ) {
            (<any> event).initKeyEvent(
                eventType, true, true, null,
                mods.ctrl || false,
                mods.alt || false,
                mods.shift || false,
                mods.meta || false,
                keyCode, keyCode
            );
        }
        else if ( (<any> event).initKeyboardEvent ) {
            (<any> event).initKeyboardEvent(
                eventType, true, true, null,
                keyCode, keyCode, null, "", null
            );

            // This hack is needed to make Chromium pick up the keycode.
            // Otherwise, keyCode will always be zero
            var setEventProperty = function ( property, value ) {
                Object.defineProperty(event, property, {
                    get: () => { return value; }
                });
            }

            setEventProperty("keyCode", keyCode);
            setEventProperty("shiftKey", !!mods.shift);
            setEventProperty("ctrlKey", !!mods.ctrl);
            setEventProperty("altKey", !!mods.alt);
            setEventProperty("metaKey", !!mods.meta);
        }
        else {
            throw new Error("Simulated keyboard events not supported!");
        }

        this.elem.dispatchEvent(event);
    }

    /** Triggers a 'keyup' event */
    public keyUp ( keyCode: number, mods: KeyModifiers = {} ): void {
        this.keyEvent("keyup", keyCode, mods);
    }

    /** Triggers a 'keydown' event */
    public keyDown ( keyCode: number, mods: KeyModifiers = {} ): void {
        this.keyEvent("keydown", keyCode, mods);
    }

    /** Simulates typing into a field */
    public typeInto ( value: string ): void {
        var input = this.as<HTMLInputElement>(this.win.HTMLInputElement);
        input.value = value;
        var event = this.doc.createEvent("UIEvent");
        event.initEvent("input", true, true);
        input.dispatchEvent(event);
    }

    /** Changes the state of a checkbox */
    public setCheckbox ( checked: boolean ): void {
        var input = this.as<HTMLInputElement>(this.win.HTMLInputElement);
        input.checked = checked;
        var event = this.doc.createEvent("HTMLEvents");
        event.initEvent("change", false, true);
        input.dispatchEvent(event);
    }

    /** Sets focus to this element */
    public focus(): void {
        this.as<HTMLElement>(this.win.HTMLElement).focus();
    }

    /** Returns whether this element currently has focus */
    public isFocused(): boolean {
        return this.doc.activeElement === this.elem;
    }
}

/** The results of a query */
class QueryResult {

    /** The number of results returned */
    count: number;

    /** The number of results returned */
    length: number;

    constructor ( public nodes: NodeList ) {
        this.count = nodes.length;
        this.length = nodes.length;
    }

    /** Asserts a single result and returns it */
    one(): Elem {
        if ( this.length !== 1 ) {
            throw new Error(
                "Expected only one result, but found " + this.length
            );
        }
        return new Elem(this.nodes[0]);
    }

    /** Asserts more than one result and returns the first element */
    first(): Elem {
        if ( this.length === 0 ) {
            throw new Error("Expected at least one result, but found none");
        }
        return new Elem(this.nodes[0]);
    }

    /** Applies a callback to each element */
    forEach( fn: (Elem) => void ): void {
        for ( var i = 0; i < this.length; i++ ) {
            fn( new Elem(this.nodes[i]) );
        }
    }
}

/** An interface for interacting with the document */
export class Doc {

    /** The html element */
    public html: Elem;

    /** The document body */
    public body: Elem;

    /** The document */
    public document: Document;

    /** The document */
    public doc: Document;

    /** The window */
    public win: CustomWindow;

    constructor ( public window: Window ) {
        this.win = <CustomWindow> window;
        this.document = window.document;
        this.doc = window.document;
        this.body = new Elem(this.document.body);
        this.html = new Elem(this.document.documentElement);
    }

    /** Runs a selector query */
    query(selector: string): QueryResult {
        return new QueryResult(this.doc.querySelectorAll(selector));
    }

    /** Pulls an element by ID */
    id( id: string ): Elem {
        var elem = this.doc.getElementById(id);
        if ( !elem ) {
            throw new Error( "Could not find element with id " + id );
        }
        return new Elem(elem);
    }
}

