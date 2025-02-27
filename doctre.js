/*

MIT License

Copyright (c) 2025 Estre Soliette (SoliEstre)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

     

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

// DOCTRE.js - Document Object Cold Taste Refrigeration Effortlessness //
// 
// Cold(array object) assigning of HTML Tree for make to JSON string.
// 
// v0.3 / release 2025.02.26
// 
// cold = [] - Cold HTML child node list
// cold[0] - Tag name, classes, id, name, type = "tag.class1.class2#id@name$type" : string
// cold[1] - Content data = cold HCNL : Array / text or html codes or empty: string / node list : NodeList / element : Element / node : Node
// cold[2] - Style codes : string / styles : object
// cold[3] - Extra attributes : object
// cold[4] - Data attributes : object
//
//
// frost = '[["div.box.float#app@root", null], "text node or html code"]'
// 
// Match replace
// ex) Doctre.parse([["|tag|.|classes|#|id|", "empty content"], "|divider|"], { tag: () => isInline ? "span" | "div", classes: "test fixed", id: getId(), divider: it => '<hr class="' + it + '" />' })

class Doctre {

    static extractTagName(solidId) {
        let tagName, majorAttrs;
        if (typeof solidId == "string") {
            const tagFilter = /^[\w:-]+/;
            tagName = tagFilter.exec(solidId)[0];
            majorAttrs = solidId.replace(tagFilter, "");
        } else {
            tagName = solidId.tagName;
            delete solidId.tagName;
            majorAttrs = solidId;
        }
        return [tagName, majorAttrs];
    }

    static extractMajorAttrs(majorAttrs, to = {}) {
        const process = (string, divider, attrName) => {
            const filter = new RegExp(divider + "[\w.-]*");
            const match = filter.exec(string);
            if (match != null) {
                to[attrName] = match[0].replace(new RegExp("^" + divider), "");
                return string.replace(filter, "");
            } else return string;
        };
        const classIdName = process(majorAttrs, "\\$", "type");
        const classId = process(classIdName, "@", "name");
        const classes = process(classId, "#", "id");
        if (classes.length > 0) to["class"] = classes === "." ? "" : classes.replace(/^\./, "").replace(/\./g, " ").replace(/\s+/g, " ").replace(/[^\w\s-]/g, "");
        return to;
    }

    static extractTagAndMajorAttrs(solidId) {
        const [tagName, majorAttrs] = this.extractTagName(solidId);
        return this.extractMajorAttrs(majorAttrs, { tagName });
    }


    static createElement(tagName = "template", majorAttrs, contentData, style = {}, attrs = {}, datas = {}, matchReplacer = {}) {
        if (tagName instanceof Array) return this.createElement(...tagName);

        const element = document.createElement(this.matchReplace(tagName, matchReplacer));
        if (majorAttrs != null) {
            const extracted = typeof majorAttrs == "string" ? this.extractMajorAttrs(majorAttrs) : majorAttrs;
            for (const attrName in extracted) element.setAttribute(this.matchReplace(attrName, matchReplacer), this.matchReplace(extracted[attrName], matchReplacer));
        }
        if (attrs != null) for (let [key, value] of Object.entries(attrs)) {
            key = this.matchReplace(key, matchReplacer);
            value = this.matchReplace(value, matchReplacer);

            switch (key) {
                case "id":
                case "name":
                case "type":
                case "class":
                case "style":
                    break;

                default:
                    element.setAttribute(key, value);
                    break;
            }
        }
        if (datas != null) for (const [key, value] of Object.entries(datas)) element.dataset[this.matchReplace(key)] = this.matchReplace(value);//Object.assign(element.dataset, datas);//
        if (contentData != null) switch (typeof contentData) {
            case "string":
                element.innerHTML = this.matchReplace(contentData, matchReplacer);
                break;

            default:
                if (contentData instanceof Array) element.append(this.createFragment(contentData, matchReplacer));
                else if (contentData instanceof NodeList) for (const node of contentData) element.appendChild(node);
                else if (contentData instanceof Node) element.appendChild(contentData);
                else if (contentData instanceof Doctre) element.appendChild(contentData.fresh(matchReplacer));
                else element.append(contentData);
                break;
        };
        if (style != null) {
            if (typeof style == "string") element.setAttribute("style", this.matchReplace(style, matchReplacer));
            else for (const [key, value] of Object.entries(style)) element.style[this.matchReplace(key)] = this.matchReplace(value);//Object.assign(element.style, style);//
        }
        return element;
    }

    static createElementReplaced(matchReplacer, tagName, majorAttrs, contentData, style = {}, attrs = {}, datas = {}, matchReplacerOrigin = {}) {
        return this.createElement(tagName, majorAttrs, contentData, style, attrs, datas, matchReplacer ?? matchReplacerOrigin);
    }

    static createElementBy(solidId, contentData, style = {}, attrs = {}, datas = {}, matchReplacer = {}) {
        if (solidId instanceof Array) return this.createElementBy(...solidId);

        let [tagName, majorAttrs] = this.extractTagName(this.matchReplace(solidId, matchReplacer));
        return this.createElement(tagName, majorAttrs, contentData, style, attrs, datas, matchReplacer);
    }

    static createElementReplacedBy(matchReplacer, solidId, contentData, style = {}, attrs = {}, datas = {}, matchReplacerOrigin = {}) {
        return this.createElementBy(solidId, contentData, style, attrs, datas, matchReplacer ?? matchReplacerOrigin);
    }

    static createFragment(hcnlArray, matchReplacer = {}) {
        const df = document.createDocumentFragment();
        for (const val of hcnlArray) switch (typeof val) {
            case "string": 
                const tmp = this.createElement();
                tmp.innerHTML = this.matchReplace(val, matchReplacer);
                for (const node of tmp.content.childNodes) df.appendChild(node);
                break;

            case "object":
            default:
                if (val instanceof Node) df.appendChild(val);
                else if (val instanceof Doctre) df.appendChild(val.fresh(matchReplacer));
                else if (val instanceof Array) df.append(this.createElementReplacedBy(matchReplacer, val));
                else df.append(val);
                break;
        };
        return df;
    }

    static matchReplace(frostOrString, matchReplacer = {}) {
        if (typeof frostOrString != "string") return this.matchReplaceObject(frostOrString, matchReplacer);

        if (matchReplacer != null) for (const key in matchReplacer) {
            const replacer = matchReplacer[key];
            switch (typeof replacer) {
                case "string":
                    frostOrString.replace("|" + key + "|", replacer);
                    break;
                case "function":
                    frostOrString.replace("|" + key + "|", replacer(key));
                    break;
            }
        }
        frostOrString.replace(/\|([^\|]*)\|/g, "$1");
        return frostOrString;
    }

    static matchReplaceObject(object, matchReplacer = {}) {
        const replaced = object.constructor();
        for (const key in object) replaced[this.matchReplace(key, matchReplacer)] = this.matchReplace(object[key], matchReplacer);
        return replaced;
    }

    static parse(frost, matchReplacer = {}) {
        return this.createFragment(JSON.parse(this.matchReplace(frost, matchReplacer)));
    }

    static live(frostOrCold, matchReplacer = {}) {
        if (typeof frostOrCold == "string") return this.parse(frostOrCold, matchReplacer);
        else return this.createFragment(frostOrCold);
    }

    static takeOut(frostOrCold, matchReplacer = {}) {
        const element = this.createElement();
        element.append(this.live(frostOrCold, matchReplacer));
        return element;
    }


    static getSolidId(tagName, className, id, name, type) {
        let solidId = tagName;
        if (className != null) solidId += "." + className.replace(/ /g, ".");
        if (id != null) solidId += "#" + id;
        if (name != null) solidId += "@" + name;
        if (type != null) solidId += "$" + type;
        return solidId;
    }

    static packTagAndMajorAttrs(element, asSolidId = false) {
        const tagName = element.tagName.toLowerCase();
        const className = element.getAttribute("class");
        const id = element.getAttribute("id");
        const name = element.getAttribute("name");
        const type = element.getAttribute("type");

        if (asSolidId) return this.getSolidId(tagName, className, id, name, type);
        else {
            const extracted = { tagName };
            if (className != null) extracted["class"] = className;
            if (id != null) extracted["id"] = id;
            if (name != null) extracted["name"] = name;
            if (type != null) extracted["type"] = type;
            return extracted;
        }
    }

    static getStyleObject(style) {
        const styles = {};
        const divided = style.split(";");
        for (var item of divided) {
            let [key, value] = item.split(":");
            key = key.trim();
            value = value.trim();
            if (key && value) styles[key] = value;
        }
        return styles;
    }

    static packAttributes(attrs) {
        const pack = {};
        for (const attr of attrs) {
            const name = attr.name;
            switch (name) {
                case "id":
                case "name":
                case "type":
                case "class":
                case "style":
                    break;
                
                default:
                    if (!name.startsWith("data-")) pack[name] = attr.value;
                    break;
            }
        }
        return pack;
    }

    static getDataObject(dataset) {
        const datas = {};
        for (const key in dataset) datas[key] = dataset[key];
        return datas;
    }
    

    static trimHecp(hecp) {
        for (var i = hecp.length - 1; i > 0; i--) {
            if (hecp[i] == null) delete hecp[i];
            else if (typeof hecp[i] == "string" || hecp[i] instanceof Array) {
                if (hecp[i].length == 0) delete hecp[i];
                else break;
            } else {
                let count = 0;
                for (const key in hecp[i]) count++;
                if (count == 0) delete hecp[i];
                else break;
            }
        }
        return hecp;
    }

    static frostElement(element, trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) {
        const frozen = [];
        frozen.push(this.packTagAndMajorAttrs(element, !elementAsDoctre));
        frozen.push(this.coldify(element.childNodes, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre));
        const style = element.getAttribute("style");
        if (styleToObject && style != null) frozen.push(this.getStyleObject(style));
        else frozen.push(style ?? {});
        frozen.push(this.packAttributes(element.attributes));
        frozen.push(this.getDataObject(element.dataset));
        return trimHecp ? this.trimHecp(frozen) : frozen;
    }

    static trimTextIndent(text) {
        return text.split("\n").map(line => {
            let std = line.trimStart();
            if (std.length != line.length) std = " " + std;
            let etd = line.trimEnd();
            if (etd.lenth != std.length) etd += " ";
            return etd;
        }).join("\n");
    }

    static frostNode(node, trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) {
        if (node instanceof Doctre) return elementAsDoctre ? node : node.frost(trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre);
        else if (node instanceof DocumentFragment) return this.coldify(node.childNodes, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre);
        else if (node instanceof Element) return this.frostElement(node, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre);
        else if (node instanceof Array) return elementAsDoctre ? new Doctre(...node) : (trimHecp ? this.trimHecp(node) : node);
        else return trimIndent ? this.trimTextIndent(node.nodeValue, trimIndent) : node.nodeValue;
    }

    static coldify(nodeOrList, trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) {
        const cold = [];
        if (nodeOrList instanceof Doctre) cold.push(elementAsDoctre ? nodeOrList : nodeOrList.frost(trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre));
        else if (nodeOrList instanceof Node) cold.push(this.frostNode(nodeOrList, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre));
        else for (const node of nodeOrList) {
            let frozen = this.frostNode(node, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre);
            if (!trimBobbleNode || typeof frozen != "string" || frozen.replace(/[\s\t\v\r\n]+/g, "").length > 0) cold.push(frozen);
        }
        return cold;
    }

    static stringify(nodeOrListOrCold, prettyJson = false, trimBobbleNode = false, trimHecp = true, styleToObject = !trimHecp, trimIndent = trimHecp) {
        const cold = this.coldify(nodeOrListOrCold, trimBobbleNode, trimHecp, styleToObject, trimIndent, false);

        if (prettyJson == null || prettyJson === false) return JSON.stringify(cold);
        else return JSON.stringify(cold, null, typeof prettyJson == "number" ? prettyJson : 2);
    }


    static patch() {
        const attach = (cls, name, value) => Object.defineProperty(cls.prototype, name, { value, writable: true, configurable: true, enumerable: false });

        attach(NodeList, "coldify", function (trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) { return Doctre.coldify(this, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre); });
        attach(NodeList, "stringify", function (prettyJson = false, trimBobbleNode = false, trimHecp = true, styleToObject = !trimHecp, trimIndent = trimHecp) { return Doctre.stringify(this, prettyJson, trimBobbleNode, trimHecp, styleToObject, trimIndent); });

        attach(Node, "coldify", function (trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) { return Doctre.coldify(this, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre); });
        attach(Node, "coldified", function (trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) { const cold = this.coldify(trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre); this.remove(); return cold; });

        attach(Node, "stringify", function (prettyJson = false, trimBobbleNode = false, trimHecp = true, styleToObject = !trimHecp, trimIndent = trimHecp) { return Doctre.stringify(this, prettyJson, trimBobbleNode, trimHecp, styleToObject, trimIndent); });
        attach(Node, "stringified", function (prettyJson = false, trimBobbleNode = false, trimHecp = true, styleToObject = !trimHecp, trimIndent = trimHecp) { const frost = this.stringify(prettyJson, trimBobbleNode, trimHecp, styleToObject, trimIndent); this.remove(); return frost; });

        attach(Element, "cold", function (trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) { return this.childNodes.coldify(trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre); });
        attach(Element, "takeCold", function (trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) { const cold = this.cold(trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre); this.innerHTML = ""; return cold; });

        attach(Element, "frozen", function (prettyJson = false, trimBobbleNode = false, trimHecp = true, styleToObject = !trimHecp, trimIndent = trimHecp) { return this.childNodes.stringify(prettyJson, trimBobbleNode, trimHecp, styleToObject, trimIndent); });
        attach(Element, "takeFrozen", function (prettyJson = false, trimBobbleNode = false, trimHecp = true, styleToObject = !trimHecp, trimIndent = trimHecp) { const frozen = this.frozen(prettyJson, trimBobbleNode, trimHecp, styleToObject, trimIndent); this.innerHTML = ""; return frozen; });

        attach(Element, "alive", function (frostOrCold, matchReplacer = {}) { this.append(Doctre.live(frostOrCold, matchReplacer)); return this; });
        attach(Element, "alone", function (frostOrCold, matchReplacer = {}) { this.innerHTML = ""; return this.alive(frostOrCold, matchReplacer); });

        attach(Element, "freeze", function (dataName = "frozen", trimBobbleNode = true) { this.dataset[dataName] = this.childNodes.stringify(false, trimBobbleNode); return this; });
        attach(Element, "solid", function (dataName = "frozen", trimBobbleNode = true) { this.freeze(dataName, trimBobbleNode); this.innerHTML = ""; return this; });

        attach(Element, "hot", function (matchReplacer = {}, dataName = "frozen") { return Doctre.live(this.dataset[dataName], matchReplacer); });
        attach(Element, "worm", function (matchReplacer = {}, dataName = "frozen") { const live = this.hot(matchReplacer, dataName); this.append(live); return live; });
        attach(Element, "melt", function (matchReplacer = {}, dataName = "frozen") { this.innerHTML = ""; return this.worm(matchReplacer, dataName); });

        attach(Element, "burn", function (matchReplacer = {}, dataName = "frozen") { const live = this.hot(matchReplacer, dataName); delete this.dataset.frozen; return live; });
        attach(Element, "wormOut", function (matchReplacer = {}, dataName = "frozen") { const frozen = this.dataset[dataName]; this.worm(frozen, matchReplacer); delete this.dataset.frozen; return frozen; });
        attach(Element, "meltOut", function (matchReplacer = {}, dataName = "frozen") { this.innerHTML = ""; return this.wormOut(matchReplacer, dataName); });
    }


    tagName;

    classes;

    id;
    name;
    type;

    childDoctres;

    style;
    attrs;
    datas;

    matchReplacer;

    constructor(solidIdOrExtracted, contentData, style = {}, attrs = {}, datas = {}, matchReplacer = {}) {
        if (solidIdOrExtracted instanceof Array) {
            solidIdOrExtracted = solidIdOrExtracted[0];
            contentData = solidIdOrExtracted[1];
            style = solidIdOrExtracted[2];
            attrs = solidIdOrExtracted[3];
            datas = solidIdOrExtracted[4];
            matchReplacer = solidIdOrExtracted[5];
        }

        if (solidIdOrExtracted != null) {
            const extracted = typeof solidIdOrExtracted == "string" ? Doctre.extractTagAndMajorAttrs(solidIdOrExtracted) : solidIdOrExtracted;
            this.tagName = extracted.tagName;
            this.classes = extracted.class?.split(" ") ?? [];
            this.id = extracted.id;
            this.name = extracted.name;
            this.type = extracted.type;
        } else {
            this.tagName = "tamplate";
            this.classes = [];
        }

        if (contentData != null) this.childDoctres = Doctre.coldify(contentData, true, false, true);
        else this.contentDoctres = [];

        this.style = style ?? {};
        this.attrs = attrs ?? {};
        this.datas = datas ?? {};
        this.matchReplacer = matchReplacer ?? {};
    }

    get className() { return this.classes.join(" "); }
    set className(value) { this.classes = value.split(" "); }

    get majorAttrs() { return {
        class: this.className,
        id: this.id,
        name: this.name,
        type: this.type,
    }; }

    get solidId() { return Doctre.getSolidId(this.tagName, this.className, this.id, this.name, this.type); }


    get live() { return Doctre.createElement(this.tagName, this.majorAttrs, this.childDoctres, this.style, this.attrs, this.datas); }

    fresh(matchReplacer) { return Doctre.createElement(this.tagName, this.majorAttrs, this.childDoctres, this.style, this.attrs, this.datas, matchReplacer ?? this.matchReplacer ?? {}); }

    frost(trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) {
        const hecp = [this.solidId, Doctre.coldify(this.childDoctres, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre), this.style, this.attrs, this.datas];
        return trimHecp ? Doctre.trimHecp(hecp) : hecp;
    }

    get icy() { return this.frost(false, true, false, false); }

    toString(prettyJson = false, trimBobbleNode = false, trimHecp = true, styleToObject = !trimHecp, trimIndent = trimHecp) {
        const hecp = this.frost(trimBobbleNode, trimHecp, styleToObject, trimIndent, false);
        if (prettyJson == null || prettyJson === false) return JSON.stringify(hecp);
        return JSON.stringify(hecp, null, typeof prettyJson == "number" ? prettyJson : 2);
    }



    get chill() { return Doctre.createFragment(this.childDoctres); }

    cold(trimBobbleNode = false, trimHecp = false, styleToObject = !trimHecp, trimIndent = trimHecp, elementAsDoctre = !trimHecp) {
        return Doctre.coldify(this.childDoctres, trimBobbleNode, trimHecp, styleToObject, trimIndent, elementAsDoctre);
    }

    frozen(prettyJson = false, trimBobbleNode = false, trimHecp = true, styleToObject = !trimHecp, trimIndent = trimHecp) {
        return Doctre.stringify(this.childDoctres, prettyJson, trimBobbleNode, trimHecp, styleToObject, trimIndent);
    }
}
