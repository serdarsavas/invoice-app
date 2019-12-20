const html = `
  <select class="VAT-select" name="hasVAT"><option value="VAT" selected>Moms &#x2714</option><option value="noVAT">Ingen moms &#x2714</option></select>
  <div class="form-control"><label>Beskrivning</label><input type="text" name="description[]" required/></div>
  <div class="form-control"><label>Datum</label><input type="text" name="date[]" /></div>
  <div class="form-control"><label>Antal</label><input type="number" name="quantity[]" step=".01" required/></div>
  <div class="form-control"><label>Enhet</label><input type="text" name="unit[]" required/></div>
  <div class="form-control"><label>Pris</label><input type="number" name="price[]" step=".01" required/></div>
  `;
const rows = document.getElementById("rows");

document.getElementById("add-row").addEventListener("click", () => {
  const row = document.createElement("div");
  row.classList.add("row");
  row.innerHTML = html;
  rows.appendChild(row);
});

document.getElementById("delete-row").addEventListener("click", () => {
  const rowElems = rows.querySelectorAll(".row");
  if (rowElems.length > 1) {
    rows.removeChild(rowElems[rowElems.length - 1]);
  }
});

document.getElementById("copy-row").addEventListener("click", () => {
  const newRow = rows.lastElementChild.cloneNode(true);
  rows.appendChild(newRow);
});

//Fetch recipients

const button = document.getElementById("get-recipients");

if (button) {
  button.addEventListener("click", async e => {
    e.preventDefault();

    try {
      const data = await fetch("/admin/get-recipient");
      const jsonData = await data.json();
      const targetRecipient = document.querySelector("#target-authority").value;
      const recipient = jsonData.find(
        item => item.authority === targetRecipient
      );
      document.querySelector("#authority").value = recipient.authority;
      document.querySelector("#ref-person").value = recipient.refPerson;
      document.querySelector("#street").value = recipient.street;
      document.querySelector("#zip").value = recipient.zip;
      document.querySelector("#city").value = recipient.city;
    } catch (e) {
      console.log(e);
    }
  });
}
