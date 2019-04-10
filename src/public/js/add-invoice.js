const html = `
<div class="form-control"><label>Beskrivning</label><input type="text" name="description[]" /></div>
<div class="form-control"><label>Antal: </label><input type="number" name="quantity[]" step=".01" /></div>
<div class="form-control"><label>Enhet:</label><input type="text" name="unit[]"/></div>
<div class="form-control"><label>Pris:</label><input type="number" name="price[]" step=".01"/>
</div>`

document.querySelector('#add-row').addEventListener('click', () => {
  const newRow = document.createElement('div')
  newRow.classList.add('row')
  newRow.innerHTML = html 
  document.querySelector('#rows').appendChild(newRow)
})




