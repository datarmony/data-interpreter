let isDark = localStorage.getItem('dark_layout');

if (isDark === "true") {
    layout_change("dark")
} else {
    layout_change("light")
}


document.getElementById("p_dark_mode").addEventListener("change", function (event) {
    log(this.checked)

    if (this.checked === true) { //set dark
        layout_change("dark")
    } else {                      //set light
        layout_change("light")
    }
})


// layoutTheme.js

function layout_change(layout) {
    var control = document.querySelector('#p_dark_mode');
    var icon = document.querySelector('#p_mode_icon');
    var logo = document.querySelector('#header-logo'); // Selecciona el logo por ID

    // Establece el atributo del tema en el body
    document.getElementsByTagName('body')[0].setAttribute('data-pc-theme', layout);

    if (layout === 'dark') {
        // --- Modo Oscuro ---
        dark_flag = true;
        localStorage.setItem('dark_layout', 'true');

        if (control) {
            control.checked = true;
        }
        if (icon) {
            icon.classList.remove("ti-sun-off");
            icon.classList.add("ti-sun");
        }
        if (logo && logo.dataset.darkSrc) {
            logo.src = logo.dataset.darkSrc;
        }

    } else {
        // --- Modo Claro ---
        dark_flag = false;
        localStorage.setItem('dark_layout', 'false');

        if (control) {
            control.checked = false;
        }

        if (icon) {
            icon.classList.remove("ti-sun");
            icon.classList.add("ti-sun-off");
        }

        if (logo && logo.dataset.lightSrc) {
            logo.src = logo.dataset.lightSrc;
        }
    }
}
