const containers = document.querySelectorAll('.invoice-item')

document.querySelector('#filter').addEventListener('input', e => {
  containers.forEach((container, index) => {
    let titleEl = container.querySelector('.invoice__title')
    let dateEl = container.querySelector('.invoice__date')
    if (
      titleEl.textContent.toLowerCase().includes(e.target.value) ||
      dateEl.textContent.toLowerCase().includes(e.target.value)
    ) {
      containers[index].style.display = 'block'
    } else {
      containers[index].style.display = 'none'
    }
  })
})
