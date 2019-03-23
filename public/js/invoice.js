const addRow = document.querySelector('#add-row')

const html = `
<div class="form-control"><label for="description">Beskrivning</label><input type="text" name="description[]" id="description" /></div>
<div class="form-control"><label for="quantity">Antal: </label><input type="number" name="quantity[]" id="quantity" step=".01" /></div>
<div class="form-control"><label for="unit">Enhet:</label><input type="text" name="unit[]" id="unit"/></div>
<div class="form-control"><label for="price">Pris:</label><input type="number" name="price[]" id="price" step=".01"/>
</div>`

addRow.addEventListener('click', () => {
  const newRow = document.createElement('div')
  newRow.innerHTML = html 
  document.querySelector('#rows').insertBefore(newRow, addRow)
})


