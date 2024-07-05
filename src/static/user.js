  // JavaScript per mostrare/nascondere il menu a tendina
document.getElementById('profile-icon').addEventListener('click', function() {
	const menu = document.getElementById('dropdown-menu');
	menu.classList.toggle('show');
  });

  // Nascondi il menu quando si clicca fuori
window.onclick = function(event) {
	if (!event.target.matches('.account-icon')) {
	  const dropdowns = document.getElementsByClassName('dropdown-menu');
	  for (let i = 0; i < dropdowns.length; i++) {
		const openDropdown = dropdowns[i];
		if (openDropdown.classList.contains('show')) {
		  openDropdown.classList.remove('show');
		}
	  }
	}
  }