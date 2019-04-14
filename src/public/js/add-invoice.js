const html = `
    <div class="form-control"><label>Beskrivning</label><input type="text" name="description[]" required/></div>
    <div class="form-control"><label>Antal: </label><input type="number" name="quantity[]" step=".01" required/></div>
    <div class="form-control"><label>Enhet:</label><input type="text" name="unit[]" required/></div>
    <div class="form-control"><label>Pris:</label><input type="number" name="price[]" step=".01" required/></div>
  `

document.querySelector('#add-row').addEventListener('click', () => {
  const rows = document.querySelector('#rows')
  const row = document.createElement('div')
  row.classList.add('row')
  row.innerHTML = html  
  rows.appendChild(newRow)
})

document.querySelector('#delete-row').addEventListener('click', () => {
  const rows = document.querySelector('#rows')
  const lastRow = rows.lastElementChild

  if (lastRow && !lastRow.classList.contains('row-header')) {
    rows.removeChild(lastRow)
  }
})

document.querySelector('#copy-row').addEventListener('click', () => {
  const rows = document.querySelector('#rows')
  const newRow = rows.lastElementChild.cloneNode(true)
  rows.appendChild(newRow)
})
