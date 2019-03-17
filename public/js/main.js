const rows = document.querySelector('#rows')
let index = 2

const html = "<div><label for='description'>Beskrivning</label><input type='text' name='description[]' id='description' /></div><div><label for='quantity'>Antal: </label><input type='text' name='quantity[]' id='quantity' /></div><div><label for='unit'>Enhet:</label><input type='text' name='unit[]' id='unit' /></div><div><label for='price'>Pris:</label><input type='text' name='price[]' id='price' /></div>"

document.querySelector('#add-row').addEventListener('click', () => {
  const newRow = document.createElement('div')
  newRow.innerHTML = `<h5>Rad ${index}</h5>${html}` 
  index++
  rows.appendChild(newRow)
})

