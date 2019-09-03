const containers = document.querySelectorAll('.invoice');
const searchField = document.querySelector('#filter');

searchField.addEventListener('input', e => {
  containers.forEach((container, index) => {
    if (
      container
        .querySelector('.invoice-header__date')
        .textContent.toLowerCase()
        .includes(e.target.value)
    ) {
      containers[index].style.display = 'flex';
    } else {
      containers[index].style.display = 'none';
    }
  });
});

searchField.addEventListener('mouseleave', e => {
  e.target.setAttribute('placeholder', 'Sök');
});

searchField.addEventListener('blur', e => {
  e.target.setAttribute('placeholder', 'Sök');
});

searchField.addEventListener('focus', e => {
  e.target.setAttribute('placeholder', 'Sök på datum (ÅÅMMDD)');
});

searchField.addEventListener('mouseenter', e => {
  e.target.setAttribute('placeholder', 'Sök på datum (ÅÅMMDD)');
});

const deleteElems = document.querySelectorAll('.delete');

deleteElems.forEach(elem => {
  elem.addEventListener('submit', e => {
    if (!confirm('Är du säker på att du vill ta bort denna faktura?')) {
      e.preventDefault();
    }
  });
});
