const rows = document.querySelector('#rows')

const html = `<br>
<div><label for='description'>Beskrivning</label><input type='text' name='description[]' id='description' /></div>
<div><label for='quantity'>Antal: </label><input type='number' name='quantity[]' id='quantity' /></div>
<div><label for='unit'>Enhet:</label><input type='text' name='unit[]' id='unit' /></div>
<div><label for='price'>Pris:</label><input type='number' name='price[]' id='price' /></div><br>`

document.querySelector('#add-row').addEventListener('click', () => {
  const newRow = document.createElement('div')
  newRow.innerHTML = html 
  rows.appendChild(newRow)
})



