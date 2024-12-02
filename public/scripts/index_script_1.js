function runAddressAutocomplete() {
    /* 
    The addressAutocomplete takes as parameters:
    - a container element (div)
    - callback to notify about address selection
    - geocoder options:
    - placeholder - placeholder text for an input element
    - type - location type
    */
    document.body.onmousedown = function () {
    if (document.getElementById('create_address') != null) {
        document.getElementById("autocomplete-container3").classList.remove("is-loading");
    }
    }
    function addressAutocomplete(containerElement, idName, callback, options) {
    // create input element
    var inputElement = document.createElement("input");
    inputElement.setAttribute("type", "text");
    inputElement.setAttribute("placeholder", options.placeholder);
    inputElement.setAttribute("id", idName);
    // inputElement.classList.add("input");
    containerElement.appendChild(inputElement);
    // add input field clear button
    var clearButton = document.createElement("div");
    clearButton.classList.add("clear-button");
    addIcon(clearButton);
    clearButton.addEventListener("click", (e) => {
        e.stopPropagation();
        inputElement.value = '';
        callback(null);
        clearButton.classList.remove("visible");
        closeDropDownList();
    });
    containerElement.appendChild(clearButton);

    /* Current autocomplete items data (GeoJSON.Feature) */
    var currentItems;

    /* Active request promise reject function. To be able to cancel the promise when a new request comes */
    var currentPromiseReject;

    /* Focused item in the autocomplete list. This variable is used to navigate with buttons */
    var focusedItemIndex;

    /* Execute a function when someone writes in the text field: */
    inputElement.addEventListener("input", function (e) {
        var currentValue = this.value;

        document.getElementById("autocomplete-container3").classList.add("is-loading");
        /* Close any already open dropdown list */
        closeDropDownList();

        // Cancel previous request promise
        if (currentPromiseReject) {
        currentPromiseReject({
            canceled: true
        });
        }

        if (!currentValue) {
        clearButton.classList.remove("visible");
        return false;
        }

        // Show clearButton when there is a text
        clearButton.classList.add("visible");

        /* Create a new promise and send geocoding request */
        var promise = new Promise((resolve, reject) => {
        currentPromiseReject = reject;

        var apiKey = "992ef3d60d434f2283ea8c6d70a4898d";
        var url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(currentValue)}&limit=5&apiKey=${apiKey}`;

        if (options.type) {
            url += `&type=${options.type}`;
        }

        fetch(url)
            .then(response => {
            // check if the call was successful
            if (response.ok) {
                response.json().then(data => resolve(data));

            } else {
                response.json().then(data => reject(data));
            }
            });
        });

        promise.then((data) => {
        document.getElementById("autocomplete-container3").classList.remove("is-loading");

        currentItems = data.features;

        /*create a DIV element that will contain the items (values):*/
        var autocompleteItemsElement = document.createElement("div");
        autocompleteItemsElement.setAttribute("class", "autocomplete-items");
        containerElement.appendChild(autocompleteItemsElement);

        /* For each item in the results */
        data.features.forEach((feature, index) => {
            /* Create a DIV element for each element: */
            var itemElement = document.createElement("DIV");
            /* Set formatted address as item value */
            itemElement.innerHTML = feature.properties.formatted;
            itemElement.classList.add("hoverAddress");
            /* Set the value for the autocomplete text field and notify: */
            itemElement.addEventListener("click", function (e) {
            inputElement.value = currentItems[index].properties.formatted;



            callback(currentItems[index]);

            /* Close the list of autocompleted values: */
            closeDropDownList();
            });

            autocompleteItemsElement.appendChild(itemElement);
        });
        }, (err) => {
        if (!err.canceled) {
            console.log(err);
        }
        });
    });

    /* Add support for keyboard navigation */
    inputElement.addEventListener("keydown", function (e) {
        var autocompleteItemsElement = containerElement.querySelector(".autocomplete-items");
        if (autocompleteItemsElement) {
        var itemElements = autocompleteItemsElement.getElementsByTagName("div");
        if (e.keyCode == 40) {
            e.preventDefault();
            /*If the arrow DOWN key is pressed, increase the focusedItemIndex variable:*/
            focusedItemIndex = focusedItemIndex !== itemElements.length - 1 ? focusedItemIndex + 1 : 0;
            /*and and make the current item more visible:*/-
            setActive(itemElements, focusedItemIndex);
        } else if (e.keyCode == 38) {
            e.preventDefault();

            /*If the arrow UP key is pressed, decrease the focusedItemIndex variable:*/
            focusedItemIndex = focusedItemIndex !== 0 ? focusedItemIndex - 1 : focusedItemIndex = (itemElements.length - 1);
            /*and and make the current item more visible:*/
            setActive(itemElements, focusedItemIndex);
        } else if (e.keyCode == 13) {
            /* If the ENTER key is pressed and value as selected, close the list*/
            e.preventDefault();
            if (focusedItemIndex > -1) {
            closeDropDownList();
            }
        }
        } else {
        if (e.keyCode == 40) {
            /* Open dropdown list again */
            var event = document.createEvent('Event');
            event.initEvent('input', true, true);
            inputElement.dispatchEvent(event);
        }
        }
    });

    function setActive(items, index) {
        if (!items || !items.length) return false;

        for (var i = 0; i < items.length; i++) {
        items[i].classList.remove("autocomplete-active");
        }

        /* Add class "autocomplete-active" to the active element*/
        items[index].classList.add("autocomplete-active");

        // Change input value and notify
        inputElement.value = currentItems[index].properties.formatted;
        callback(currentItems[index]);
    }

    function closeDropDownList() {
        var autocompleteItemsElement = containerElement.querySelector(".autocomplete-items");
        if (autocompleteItemsElement) {
        containerElement.removeChild(autocompleteItemsElement);
        }

        focusedItemIndex = -1;
    }

    function addIcon(buttonElement) {
        var svgElement = document.createElementNS("", 'svg');
        svgElement.setAttribute('viewBox', "0 0 24 24");
        svgElement.setAttribute('height', "24");


    }

    /* Close the autocomplete dropdown when the document is clicked. 
    Skip, when a user clicks on the input field */
    document.addEventListener("click", function (e) {
        if (e.target !== inputElement) {
        closeDropDownList();
        } else if (!containerElement.querySelector(".autocomplete-items")) {
        // open dropdown list again
        var event = document.createEvent('Event');
        event.initEvent('input', true, true);
        inputElement.dispatchEvent(event);
        }
    });

    }

    addressAutocomplete(document.getElementById("autocomplete-container3"), "create_address", (data) => {
    console.log("Selected option: ");
    console.log(data);
    console.log(data.properties.formatted);
    arr.push(data.properties.formatted);
    }, {

    placeholder: "Enter an address here"

    });

}