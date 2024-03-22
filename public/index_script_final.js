let carpoools;

    var request = new Request("/api/carpools", {
        method: "GET",
        headers: new Headers({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        })
      });
      fetch(request)
        .then((response) => response.json())
        .then((data) => {
          carpoools = data;
        })
     .catch((error) => {
       console.error(error)
     });

    let carpooledEvents = []
    function checkIfRegistered(carpoools) {


      for (var i = 0; i < carpoools.length; i++){
        let carpoolPart = carpoools[i].carpoolers.find((x) => x.email === "<%= email %>")
        if (carpoolPart != undefined) {
          carpoolPart = carpoolPart.email
        }
        if (carpoolPart == "<%= email %>") {
          let carpooledEvent = eventsW2.find((x) => x.id === carpoools[i].nameOfEvent)
          if (carpooledEvent != undefined) {
            carpooledEvents.push(carpooledEvent)
          }
        }
      }

      turnRegistered(carpooledEvents)
    }

    function turnRegistered(eventsToDisable) {

      for (var i = 0; i < eventsToDisable.length; i++){

 console.log(document.getElementById(eventsToDisable[i].id))       
   document.getElementById(eventsToDisable[i].id).disabled = true;
        document.getElementById(eventsToDisable[i].id).innerHTML = "Registered for this event"
        }
      }

     function getDayOfWeek(string) {
       const d = new Date(string);
       const dayOfWeek = d.getDay();

       // Example: Get the name of the weekday (not just a number)
       const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
       const currentDay = weekdays[dayOfWeek];
       return(currentDay)
     }  

     var eventsW2 = [];

     function sendData(data){
       datarray.push(data);
       console.log(data);
     }
     var datarray = [];
     function createevent() {
       firstName="<%= firstName %> "
       lastName="<%= lastName %> "
       eventName=document.getElementById("ename").value
       wlocation=document.getElementById("elocation").value
       console.log(wlocation)
       dateb=document.getElementById("edate").value//hotdogs
       var components = dateb.split(/[-T:]/);
       // Create a new Date object
       var dateTimeObject = new Date(components[0], components[1] - 1, components[2], components[3], components[4]);
       // Format the Date object as a string in the desired format
       date = dateTimeObject.toLocaleString('en-US', {
           month: 'numeric',
           day: 'numeric',
           year: 'numeric',
           hour: 'numeric',
           minute: 'numeric',
           hour12: true
       });


       category=document.getElementById("ecategory").value
       const data = {
         firstName,
         lastName,
         eventName,
         wlocation,
         date,
         category
       };
       console.log(data);

       const jsonData = JSON.stringify(data);

       const url = "/api/events";

       fetch(url, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: jsonData,
       })
     }
     let eventsW;
     var request = new Request("/api/events", {
       method: "GET",
       headers: new Headers({
         Accept: 'application/json',
         'Content-Type': 'application/json',
       })
     });
     fetch(request)
       .then((response) => response.json())
       .then((data) => {

         eventsW = data;
         console.log(eventsW);
         eventsW2 = sortJSON(eventsW,'date', '123'); 
         console.log(eventsW2);


     console.log("length:" + eventsW2.length)
     for (var i = 0; i < eventsW2.length; i++){
     var obj = eventsW2[i];
       var day = getDayOfWeek(obj["date"]);

     document.getElementById("eventsJS").innerHTML += `<article class="panel is-link has-text-centered" style=" margin-top: 10px;" >
     <div style="float: left; margin: 7px; left:0px; position: absolute " class="booker" >
      <span class="panel-icon" style='color: white; display: inline'>
        <i class="fas fa-book" aria-hidden="true" style="margin: 13px; margin-left: 15px;"></i>
        <p style="color: white; display: inline; font-size: 15px; " >Booked by `+ obj["firstName"] +` `+ obj["lastName"] +`</p>
      </span>
     </div>
     <p class="panel-heading link-heading" style="margin-top: -10px;background: linear-gradient(105deg, #3273DC, #275CBF); " >

     `+obj["eventName"]+`


     </p>


     <div class="panel-block">
      <p class="control has-icons-left" style="width: 100px;">

        <span style="color: #999999; margin-right: 5px;"><i class="fa-solid fa-location-dot "></i></span>Location: `+obj["wlocation"]+`<br class="extraspace" style='display: none; '>  <span id="clock"  style="color: #999999; margin-right: 5px; margin-left: 10px;"><i class="fa-solid fa-clock "></i></span> Date: ` + day + `, ` + obj["date"]+`
       </p>
      <div class="buttons upcoming-buttons" style="float: left; display: inline-block;">

      <button class="button js-modal-trigger" style="margin-right: 5px;" data-target="modal-js-example" id="`+ obj["id"] + `_offer` +`" onclick=sendData('`+obj["id"]+`')>Offer to carpool</button>

      <button class="button js-modal-trigger" data-target="modal-js-register" id="`+ obj["id"] + `" onclick=sendData('`+obj["id"]+`')>Register for this event</button>
       </div>
       </div>




     </article>`;

     }
         checkIfRegistered(carpoools)






     //sort events by date
         function sortJSON(arr, key, way) {
             return arr.sort(function(a, b) {
                 var datex = a[key]; var datey = b[key];

               datex = new Date(datex)
                datey = new Date(datey)
               x = datex.getTime() / 1000
                y = datey.getTime() / 1000
                 if (way === '123') { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
                 if (way === '321') { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
             });
         }

         // eventsW2 = sortJSON(eventsW,'date', '123'); 
         // console.log("Sorted events: " + JSON.stringify(eventsW2));




         document.getElementById("filter").onchange = filter;
         function filter() {
           document.getElementById("eventsJS").innerHTML = ``
            for (var i = 0; i < eventsW.length; i++){
             var obj = eventsW[i];
              var day = getDayOfWeek(obj["date"]);
              if (document.getElementById("filter").value == "all") {
                // `<div style="float: right; margin: 10px; width: 35px; height: 35px; background-color: hsl(348, 100%, 61%); border-radius: 5px
                //    " <="" div=""></div>`
                  document.getElementById("eventsJS").innerHTML += `<article class="panel is-link has-text-centered" style=" margin-top: 10px;" >
                 <div style="float: left; margin: 7px; left:0px; position: absolute " class="booker" >
                   <span class="panel-icon" style='color: white; display: inline'>
                     <i class="fas fa-book" aria-hidden="true" style="margin: 13px; margin-left: 15px;"></i>
                     <p style="color: white; display: inline; font-size: 15px; " >Booked by `+ obj["firstName"] +` `+ obj["lastName"] +`</p>
                   </span>
                 </div>
                 <p class="panel-heading link-heading" style="margin-top: -10px;background: linear-gradient(105deg, #3273DC, #275CBF); " >

                `+obj["eventName"]+`


                 </p>


                 <div class="panel-block">
                   <p class="control has-icons-left" style="width: 100px;">

                     <span style="color: #999999; margin-right: 5px;"><i class="fa-solid fa-location-dot "></i></span>Location: `+obj["wlocation"]+`<br class="extraspace" style='display: none; '>  <span id="clock"  style="color: #999999; margin-right: 5px; margin-left: 10px;"><i class="fa-solid fa-clock "></i></span> Date: ` + day + `, ` + obj["date"] + `
                    </p>
                   <div class="buttons upcoming-buttons" style="float: left; display: inline-block;">

                   <button class="button js-modal-trigger" style="margin-right: 5px;" data-target="modal-js-example" id="`+ obj["id"] + `_offer` +`" onclick=sendData('`+obj["id"]+`')>Offer to carpool</button>

                   <button class="button js-modal-trigger" data-target="modal-js-register" id="`+ obj["id"] + `" onclick=sendData('`+obj["id"]+`')>Register for this event</button>
                    </div>
                    </div>




                </article>`;
                   }

              else if (document.getElementById("filter").value == obj["category"]) {
             document.getElementById("eventsJS").innerHTML += `<article class="panel is-link has-text-centered" style=" margin-top: 10px;" >
            <div style="float: left; margin: 7px; left:0px; position: absolute " class="booker" >
              <span class="panel-icon" style='color: white; display: inline'>
                <i class="fas fa-book" aria-hidden="true" style="margin: 13px; margin-left: 15px;"></i>
                <p style="color: white; display: inline; font-size: 15px; " >Booked by `+ obj["firstName"] +` `+ obj["lastName"] +`</p>
              </span>
            </div>
            <p class="panel-heading link-heading" style="margin-top: -10px;background: linear-gradient(105deg, #3273DC, #275CBF); " >

           `+obj["eventName"]+`


            </p>


            <div class="panel-block">
              <p class="control has-icons-left" style="width: 100px;">

                <span style="color: #999999; margin-right: 5px;"><i class="fa-solid fa-location-dot "></i></span>Location: `+obj["wlocation"]+`<br class="extraspace" style='display: none; '>  <span id="clock"  style="color: #999999; margin-right: 5px; margin-left: 10px;"><i class="fa-solid fa-clock "></i></span> Date: ` + day + `, ` + obj["date"]+`
               </p>
              <div class="buttons upcoming-buttons" style="float: left; display: inline-block;">

              <button class="button js-modal-trigger" style="margin-right: 5px;" data-target="modal-js-example" id="`+ obj["id"] + `_offer` + `" onclick=sendData('`+obj["id"]+`')>Offer to carpool</button>

              <button class="button js-modal-trigger" data-target="modal-js-register" id="`+ obj["id"] + `" onclick=sendData('`+obj["id"]+`')>Register for this event</button>
               </div>
               </div>




           </article>`;
              }

             }

           checkIfRegistered(carpoools)
           modalFunctions()
         }


         function modalFunctions(){


         function openModal($el) {
         $el.classList.add('is-active');






               document.getElementById("registerJS").innerHTML = ``;

               //checks if the carpools id matches an events id

                 for (var i = 0; i < eventsW2.length; i++){
                   if (eventsW2[i].id == datarray[datarray.length - 1]) {
                     eventTime = new Date(eventsW2[i].date);

                     let dayOfWeek = eventTime.getDay();
                      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                      let day = weekdays[dayOfWeek];

                     eventTime = eventTime.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
                     console.log(eventTime)


                       document.getElementById("registerTitle").innerText = "Choose a carpool · " + day + " at " + eventTime
                   }
                 }


            for (var i = 0; i < carpoools.length; i++){
             var obj = carpoools[i];

                if (obj["nameOfEvent"] == datarray[datarray.length - 1]) {



              //datarray[datarray.length - 1]


              var routeType;
              if (obj["route"] == "route") {
                routeType = "Home to home"
              }
              else if (obj["route"] == "point") {
                   routeType = "Common meeting point"
                 }

           document.getElementById("registerJS").innerHTML +=
           `<div class="notification"  style="padding: 10px;   margin-bottom: 10px;">
                                                  <div class="button  selectCarpool" style=" margin-left: 10px; margin-top: 4px; background-color: transparent; float: right" onclick=" selectCarpool(this)" id="` + obj["id"] + `">Select</div>
                                                          <div style="float: right; margin-top: 3px;"  >` + obj["carpoolers"].length + `/`+ obj["seats"] +` signed up</div>
                                                                                    Organizer: <a style="color: #3273dc" href="mailto:` + obj["email"] + `">` + obj["email"] + `</a>
                                                            <br> Driver name: ` + obj["firstName"] + ` ` + obj["lastName"].charAt(0) + `<br> Route type: ` + routeType + `
                   <br>                                                                                          </div>   `
            }
              }


         }

         function closeModal($el) {
         $el.classList.remove('is-active');
         }

         function closeAllModals() {
         (document.querySelectorAll('.modal') || []).forEach(($modal) => {
         closeModal($modal);
         });
         }

         // Add a click event on buttons to open a specific modal
         (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
         const modal = $trigger.dataset.target;
         const $target = document.getElementById(modal);

         $trigger.addEventListener('click', () => {
         openModal($target);
         });
         });

         // Add a click event on various child elements to close the parent modal
         (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .cancel') || []).forEach(($close) => {
         const $target = $close.closest('.modal');

         $close.addEventListener('click', () => {
         closeModal($target);
         });
         });

         // Add a keyboard event to close all modals
         document.addEventListener('keydown', (event) => {
         const e = event || window.event;

         if (e.keyCode === 27) { // Escape key
         closeAllModals();
         }
         });

         }
         modalFunctions()






     })
     .catch((error) => {
       console.error(error);
     });


     let selectedCarpool = null;

     function selectCarpool(element) {
       if (element.classList[2] == 'is-focused') {
         unfocus(); 
         selectedCarpool = null
       } else {
         unfocus(); element.classList.add('is-focused');
         selectedCarpool = element.id;
       }; 

     }





     function offerACar(firstName, lastName, seats, route, wlocation, carpoolers, nameOfEvent){
       let email = "<%= email %>"
       const newcarpools = {
         firstName,
         lastName,
         seats,
         route,
         wlocation,//location is a used variable
         carpoolers,
         nameOfEvent,
         email
       };
       console.log(newcarpools);

       const jsonData = JSON.stringify(newcarpools);
       const url = "/api/carpools";


       fetch(url, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: jsonData,
       })
         .then((response) => {
           console.log(response);
           // Open verification checker
         })
         .catch((error) => console.error("Error:", error));
     }

     /* 
     The addressAutocomplete takes as parameters:
     - a container element (div)
     - callback to notify about address selection
     - geocoder options:
     - placeholder - placeholder text for an input element
     - type - location type
     */





         document.body.onmousedown = function() {
         if (document.getElementById('address-input') != null) {
            document.getElementById("autocomplete-container").classList.remove("is-loading");
           document.getElementById("autocomplete-container2").classList.remove("is-loading");
         }

         }
           var arr = [];


         function addressAutocomplete(containerElement, idName, callback, options) {
         // create input element
         var inputElement = document.createElement("input");
         inputElement.setAttribute("type", "text");
         inputElement.setAttribute("placeholder", options.placeholder);
         inputElement.setAttribute("id", idName);
         inputElement.classList.add("input");
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
         inputElement.addEventListener("input", function(e) {
         var currentValue = this.value;

         document.getElementById("autocomplete-container").classList.add("is-loading");
         document.getElementById("autocomplete-container2").classList.add("is-loading");

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
         document.getElementById("autocomplete-container").classList.remove("is-loading");
         document.getElementById("autocomplete-container2").classList.remove("is-loading");
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
         itemElement.addEventListener("click", function(e) {
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
         inputElement.addEventListener("keydown", function(e) {
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
         document.addEventListener("click", function(e) {
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

         addressAutocomplete(document.getElementById("autocomplete-container"), "address-input", (data) => {
         console.log("Selected option: ");
         console.log(data);
         console.log(data.properties.formatted);
         arr.push(data.properties.formatted);
         }, {

         placeholder: "Enter an address here"

         });

         addressAutocomplete(document.getElementById("autocomplete-container2"), "address-input2", (data) => {
         console.log("Selected option: ");
         console.log(data);
         console.log(data.properties.formatted);
         arr.push(data.properties.formatted);
         }, {

         placeholder: "Enter an address here"

         });




       // Code for the second function
       function joinCarpool() {
         let newArray = document.getElementById("address-input2").value
         var personName = "<%= firstName %> <%= lastName %>";
         var email = "<%= email %>";
         var carpoool;
         if (selectedCarpool != null){
  for (var i = 0; i < carpoools.length; i++) {
    carpoool = carpoools[i]
    if (carpoool["id"] == selectedCarpool) {
      carpoool["carpoolers"].push({
        "address": newArray,
        "carpool": selectedCarpool
      })

      const addNewMember = {
        address: newArray,
        carpool: selectedCarpool
      }

      console.log(carpoool)
      jsonData = JSON.stringify(addNewMember)

      url = "/api/joinCarpool"

      fetch(url, {
         method: 'POST',
         headers: {
           "Content-Type": "application/json",
         },
         body: jsonData,
       })
      .then((response) => {
        if (response.redirected) {
          window.location.href = response.url;
        }
      })






       }
    }
  }


  }
         // var request = new Request("/api/carpools", {
         //    method: "GET",
         //    headers: new Headers({
         //      Accept: 'application/json',
         //      'Content-Type': 'application/json',
         //    })
         //  });
         //  fetch(request)
         //    .then((response) => response.json())
         //    .then((data) => {

         //      console.log(data)
         //    })
         //add first name + last name: address to the carpoolers list in correct carpool id (selectedCarpool) carpools database


       function offer(id) {
         let newArray = document.getElementById("address-input").value

         console.log(newArray)
         let DriverFName = document.getElementById("fname").value;
         let DriverLName = document.getElementById("lname").value;
         let Seats = document.getElementById("seats").value;
         let route = document.getElementById("route-type").value;
         let Carpoolers = []
         // var personName = "<%= firstName %> <%= lastName %>";
         console.log(newArray+ " " + DriverFName + " " + DriverLName + " " + Seats);
         offerACar(DriverFName, DriverLName, Seats, route, newArray, Carpoolers, datarray[datarray.length - 1]);
       }





     // Call the first function and then execute the second function using .then()
function closeAllModals() {
   (document.querySelectorAll('.modal') || []).forEach(($modal) => {
   closeModal($modal);
   });
   }
   function closeModal($el) {
   $el.classList.remove('is-active');
   }



   var route_type = document.getElementById("route-type");
   var address_label =  document.getElementById("address-label");

   function changeLabel() {
   if (route_type.value == "route") {
   address_label.innerText = "Your home address";
   }
   else if (route_type.value == "point") {
   address_label.innerText = "Meeting point";
   }
   }

   route_type.onchange = changeLabel;
   changeLabel();


   function unfocus() {
   var selects = document.getElementsByClassName('selectCarpool')
   for (const element of selects) { // You can use `let` instead of `const` if you like
   element.classList.remove('is-focused');
   }
   }