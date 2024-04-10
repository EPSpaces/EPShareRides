document.addEventListener("DOMContentLoaded", () => {
  // Functions to open and close a modal
  function openModal($el) {
    $el.classList.add("is-active");
  }

  function closeModal($el) {
    $el.classList.remove("is-active");
  }

  function closeAllModals() {
    (document.querySelectorAll(".modal") || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll(".js-modal-trigger") || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener("click", () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (
    document.querySelectorAll(
      ".modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button",
    ) || []
  ).forEach(($close) => {
    const $target = $close.closest(".modal");

    $close.addEventListener("click", () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });
});

function dataInput() {
  var email = document.getElementById("email").value;
  /*var a = [b];
  localStorage.setItem("array", a);*/
  console.log(email);
}

/*function signup() {
  const email = document.getElementById("email").value;
  const firstName = document.getElementById("first_name").value;
  const lastName = document.getElementById("last_name").value;
  const admin = false;

  const data = {
    firstName,
    lastName,
    email,
    admin
  };

  const jsonData = JSON.stringify(data);

  const url = "/auth/signup";

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

function checkAndVerifyCode() {}
*/
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  let confirm_password = document.getElementById("confirm_password").value;
  const firstName = document.getElementById("first_name").value;
  const lastName = document.getElementById("last_name").value;
  const admin = false;
  const privacy = false;
  const address = "none";

  if (password !== confirm_password) {
    confirm_password = "";
    window.location.href = "/signup?err=Passwords do not match";
    return;
  }

  const data = {
    firstName,
    lastName,
    email,
    password,
    admin,
    address,
    privacy,
  };

  const url = "/auth/signup";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      }
    })
    .catch((error) => console.error("Error:", error));
}
