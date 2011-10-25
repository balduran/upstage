// This is the core of the [Upstage](http://github.com/reid/upstage)
// presentation system. Upstage is built as a collection of modules
// on top of [YUI](http://developer.yahoo.com/yui/3/).

// If you'd like to build a slideshow, check out the
// [README](http://github.com/reid/upstage/blob/master/README.md).

// Upstage was written by [Reid Burke](http://github.com/reid)
// at Yahoo! Inc.
// It's free to use under the [BSD license](http://developer.yahoo.com/yui/license.html).

Y.Node.addMethod("parentsUntil", function parentsUntil (parentNode) {
    // TODO: Fix implementation to parentNode.
    return this.ancestors();
});

function Upstage() {
    Upstage.superclass.constructor.apply(this, arguments);
}

Upstage.NAME = Upstage.CSS_PREFIX =  "upstage";

Upstage.ATTRS = {
    slides: {
        value: null
    },
    currentSlide: {
        value: -1
    },
    classes: {
        value: {
            container: "deck-container",
            after: "deck-after",
            before: "deck-before",
            current: "deck-current",
            childCurrent: "deck-child-current",
            next: "deck-next",
            onPrefix: "on-slide-",
            previous: "deck-previous"
        }
    }
};

Upstage.HTML_PARSER = {
    slides: [".slide"]
};

Y.extend(Upstage, Y.Widget, {
    initializer: function () {
        this.get("contentBox").addClass(this.get("classes").container);
        this._publishEvents();
        this._detectFeatures();
    },
    _detectFeatures: function () {
        // deck.js compat
        var boundingBox = this.get("boundingBox"),
            style = Y.config.doc.documentElement.style,
            prefixes = "Webkit Moz O ms Khtml".split(" "), // warning: khtml will be skipped
            transformProperties = prefixes
                .join("Transform,").split(","),
            transitionProperties = prefixes
                .join("TransitionProperty,").split(",");

        function testStyle (property) {
            return property in style;
        }

        if (Y.Array.some(transformProperties, testStyle)) {
            boundingBox.addClass("csstransforms");
        }
        if (Y.Array.some(transitionProperties, testStyle)) {
            boundingBox.addClass("csstransitions");
        }
    },
    _publishEvents: function () {
        this.publish("warp", {
            emitFacade: true,
            defaultFn: function (ev, mouseEvent) {
                if (mouseEvent && mouseEvent.halt) {
                    // prevent navigation to "#"
                    mouseEvent.halt();
                }
                this.fire("navigate", this.get("currentSlide") + ev.details[0]);
            }
        });

        this.publish("navigate", {
            emitFacade: true,
            defaultFn: function (ev) {
                var nextIndex = ev.details[0];
                var validated = false;
                nextIndex = this.snapToBounds(nextIndex);
                if (isNaN(nextIndex)) {
                    Y.log("Invalid index, ignoring.", "info", "upstage");
                } else if (nextIndex != ev.details[0]) {
                    Y.log("Index out of bounds, ignoring.", "info", "upstage");
                } else if (nextIndex === this.get("currentSlide")) {
                    Y.log("Nothing changed, ignoring.", "info", "upstage");
                } else {
                    validated = true;
                }
                if (validated) {
                    Y.log("Navigating to slide: " + nextIndex, "info", "upstage");
                    this.set("currentSlide", nextIndex);
                    this._updateState();
                } else {
                    ev.stopImmediatePropagation();
                }
            }
        });
    },
    snapToBounds: function (index) {
        index = Math.min(index, this.get("slides").size());
        index = Math.max(1, index);
        return index;
    },
    syncUI: function () {
        var currentSlide = this.get("currentSlide");
        if (currentSlide === -1) {
            Y.log("Firing navigate since no navigation occured at startup.", "info", "upstage");
            this.fire("navigate", 1);
        }
    },
    _updateState: function () {
        var classes = this.get("classes");
        var contentBox = this.get("contentBox");
        var slides = this.get("slides");
        var current = this.get("currentSlide") - 1;

        // not the previous slide, per-se.
        // just the one that's about tbe be navigated away from.
        var lastSlide = contentBox.one("." + classes.current);

        var currentSlide = slides.item(current);

        Y.Array.each([
            classes.before,
            classes.previous,
            classes.next,
            classes.after,
            classes.current
        ], slides.removeClass, slides);

        currentSlide.addClass(classes.current);

        if (lastSlide) {
            // Last slide doesn't exist on startup.
            lastSlide.parentsUntil(contentBox).removeClass(classes.childCurrent);
        }
        currentSlide.parentsUntil(contentBox).addClass(classes.childCurrent);

        var slideTotal = slides.size();

        if (current > 0) {
            slides.item(current - 1).addClass(classes.previous);
        }
        if (current + 1 < slideTotal) {
            slides.item(current + 1).addClass(classes.next);
        }
        if (current > 1) {
            slides.slice(0, current - 1).addClass(classes.before);
        }
        if (current + 2 < slideTotal) {
            slides.slice(current + 2).addClass(classes.after);
        }
        this.fire("widget:contentUpdate");
    }
});

Y.augment(Upstage, Y.EventTarget);

Y.namespace("Upstage");
Y.Upstage = Upstage;