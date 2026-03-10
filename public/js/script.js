(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

// Sidebar Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
  const filterBtn = document.getElementById('filter-btn');
  const sidebar = document.getElementById('sidebar');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('show');
    });
  }

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('show');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('show');
    });
  }

  // --- Initialize Navbar Guest Selection ---
  function initGuestSelection(guestInputId, guestDropdownId, adultsCountId, childrenCountId) {
    const guestInput = document.getElementById(guestInputId);
    const guestDropdown = document.getElementById(guestDropdownId);
    if (!guestInput || !guestDropdown) return null;

    const adultsCount = document.getElementById(adultsCountId);
    const childrenCount = document.getElementById(childrenCountId);

    // Parse existing values from the input if possible
    let adults = 1;
    let children = 0;
    if (guestInput.value) {
      const adultsMatch = guestInput.value.match(/(\d+) Adult/);
      const childrenMatch = guestInput.value.match(/(\d+) Child/);
      if (adultsMatch) adults = parseInt(adultsMatch[1]);
      if (childrenMatch) children = parseInt(childrenMatch[1]);
    }

    adultsCount.textContent = adults;
    childrenCount.textContent = children;

    function updateGuestInput() {
      let guestText = `${adults} Adult${adults > 1 ? 's' : ''}`;
      if (children > 0) guestText += `, ${children} Child${children > 1 ? 'ren' : ''}`;
      guestInput.value = guestText;
    }

    guestInput.addEventListener('click', (event) => {
      event.stopPropagation();
      // Close other dropdowns
      document.querySelectorAll('.guest-dropdown-menu, .mobile-guest-options').forEach(el => {
        if (el !== guestDropdown) el.style.display = 'none';
      });
      const isCurrentlyHidden = guestDropdown.style.display === 'none' || !guestDropdown.style.display;
      guestDropdown.style.display = isCurrentlyHidden ? 'block' : 'none';

      // Position dropdown dynamically below the input
      if (isCurrentlyHidden) {
        const inputRect = guestInput.getBoundingClientRect();
        guestDropdown.style.position = 'absolute';
        guestDropdown.style.top = `${inputRect.bottom + window.scrollY + 8}px`;
        guestDropdown.style.left = `${inputRect.left + window.scrollX - 70}px`; // Offset slightly left for better alignment
        guestDropdown.style.zIndex = '1055';
        guestDropdown.style.minWidth = '250px';
      }
    });

    guestDropdown.addEventListener('click', (event) => {
      event.stopPropagation();
      if (event.target.classList.contains('counter-btn')) {
        const type = event.target.dataset.type;
        const action = event.target.dataset.action;

        if (type === 'adults') {
          if (action === 'increment') adults++;
          else if (action === 'decrement' && adults > 1) adults--;
          adultsCount.textContent = adults;
        } else if (type === 'children') {
          if (action === 'increment') children++;
          else if (action === 'decrement' && children > 0) children--;
          childrenCount.textContent = children;
        }
        updateGuestInput();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
      if (!guestInput.contains(event.target) && !guestDropdown.contains(event.target)) {
        guestDropdown.style.display = 'none';
      }
    });

    return () => ({ adults, children, guestString: guestInput.value });
  }

  // Initialize desktop and mobile navbar guest selection
  initGuestSelection('guests', 'guest-dropdown', 'adults-count', 'children-count');

  // --- Initialize Litepicker for dates ---
  if (typeof Litepicker !== 'undefined') {
    const datesInput = document.getElementById('dates');
    if (datesInput) {
      new Litepicker({
        element: datesInput,
        singleMode: false,
        format: 'DD MMM YYYY',
        tooltipText: {
          one: 'night',
          other: 'nights'
        },
        tooltipNumber: (totalDays) => {
          return totalDays - 1;
        }
      });
    }

    const mobileDatesInput = document.getElementById('mobile-dates');
    if (mobileDatesInput) {
      new Litepicker({
        element: mobileDatesInput,
        singleMode: false,
        format: 'DD MMM YYYY',
        tooltipText: {
          one: 'night',
          other: 'nights'
        },
        tooltipNumber: (totalDays) => {
          return totalDays - 1;
        }
      });
    }
  }
});