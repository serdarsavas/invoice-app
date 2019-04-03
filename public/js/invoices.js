const containers = document.querySelectorAll('.invoice')

document.querySelector('#filter').addEventListener('input', e => {
  containers.forEach((container, index) => {
    if (
      container
        .querySelector('.invoice-header__date')
        .textContent.toLowerCase()
        .includes(e.target.value)
    ) {
      containers[index].style.display = 'flex'
    } else {
      containers[index].style.display = 'none'
    }
  })
})

const deleteElems = document.querySelectorAll('.delete')

deleteElems.forEach(elem => {
  elem.addEventListener('submit', e => {
    if (!confirm('Är du säker på att du vill ta bort denna faktura?')) {
      e.preventDefault()
    }
  })
})
