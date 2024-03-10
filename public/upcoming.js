function createevent(firstName, lastName, eventName, location, date) {

  const data = {
    firstName,
    lastName,
    eventName,
    location,
    date
  };

  const jsonData = JSON.stringify(data);

  const url = "/database/events";

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