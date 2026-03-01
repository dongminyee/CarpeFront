  
  const menuBtns = document.querySelectorAll('.menu-btn');
  const hovermenu = document.getElementById('megaDropdown');
  const headerContainer = document.querySelector('header .container');
  let dropdownTimeout = null;

  menuBtns.forEach(btn => {
    btn.addEventListener('mouseenter', showDropdown);
    btn.addEventListener('focus', showDropdown);
  });
  headerContainer.addEventListener('mouseleave', hideDropdown);
  hovermenu.addEventListener('mouseleave', hideDropdown);

  hovermenu.addEventListener('mouseenter', () => {
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
  });

  function showDropdown() {
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
    hovermenu.classList.add('active');
  }
  function hideDropdown() {
    dropdownTimeout = setTimeout(() => {
      hovermenu.classList.remove('active');
    }, 120); // 0.12초 뒤에 닫힘
  }