
(function(){
const wrap = document.getElementById('yearSwitch');
const btn  = document.getElementById('yearToggle');
const menu = document.getElementById('yearMenu');

function openMenu() {
    wrap.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
}

btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    wrap.classList.contains('open') ? closeMenu() : openMenu();
});

// 메뉴 클릭 시 자동 닫기 (이동 전/후 상관없이)
menu.addEventListener('click', ()=> closeMenu());

// 바깥 클릭 시 닫기
document.addEventListener('click', (e)=>{
    if(!wrap.contains(e.target)) closeMenu();
});

// ESC 닫기
document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeMenu();
});
})();

