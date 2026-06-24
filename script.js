const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

menuBtn.addEventListener("click", () => {
  nav.classList.toggle("active");
});

const sections = document.querySelectorAll(
  ".section, .intro, .addons, .why, .cta"
);

sections.forEach((section) => {
  section.classList.add("reveal");
});

window.addEventListener("scroll", () => {
  sections.forEach((section) => {
    const sectionTop = section.getBoundingClientRect().top;
    const screenPosition = window.innerHeight - 100;

    if (sectionTop < screenPosition) {
      section.classList.add("active");
    }
  });
});
