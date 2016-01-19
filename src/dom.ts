
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

/** A single dom element */
class Elem {

    /** The document that owns this node */
    doc: Document;

    /** The html element being wrapped */
    constructor (public elem: Node) {
        this.doc = this.elem.ownerDocument;
    }

    /** Converts the element to the given type */
    private as<T> ( typename: Function ): T {
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

    /** Returns whether an element is visible */
    public isVisible (): boolean {
        var elem = this.as<HTMLElement>(HTMLElement);
        return elem.style.display !== "none";
    }

    /** Triggers a 'keyup' event */
    public keyup ( keyCode: number ): void {
        var event = this.doc.createEvent("KeyboardEvent");

        var init = (<any> event).initKeyboardEvent ||
            (<any> event).initKeyEvent ||
            (<any> event).initEvent;

        init.call(event,
            "keyup", true, true, null,
            false, false, false, false,
            keyCode, keyCode
        );

        // This hack is needed to make Chromium pick up the keycode.
        // Otherwise, keyCode will always be zero
        Object.defineProperty(event, "keyCode", {
            get : function() {
                return keyCode;
            }
        });

        this.elem.dispatchEvent(event);
    }

    /** Simulates typing into a field */
    public typeInto ( value: string ): void {
        var input = this.as<HTMLInputElement>(HTMLInputElement);
        input.value = value;
        var event = this.doc.createEvent("UIEvent");
        event.initEvent("input", true, true);
        input.dispatchEvent(event);
    }

    /** Changes the state of a checkbox */
    public setCheckbox ( checked: boolean ): void {
        var input = this.as<HTMLInputElement>(HTMLInputElement);
        input.checked = checked;
        var event = this.doc.createEvent("HTMLEvents");
        event.initEvent("change", false, true);
        input.dispatchEvent(event);
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
        if ( this.length !== 0 ) {
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

    /** The document body */
    public body: Elem;

    /** The document */
    public document: Document;

    /** The document */
    public doc: Document;

    /** The window */
    public win: Window;

    constructor ( public window: Window ) {
        this.win = window;
        this.document = window.document;
        this.doc = window.document;
        this.body = new Elem(this.document.body);
    }

    /** Runs a selector query */
    query(selector: string): QueryResult {
        return new QueryResult(this.doc.querySelectorAll(selector));
    }
}

