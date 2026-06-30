const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

menuBtn.addEventListener("click", () => {
  nav.classList.toggle("active");
});

const sections = document.querySelectorAll(
  ".section, .booking, .feature-strip"
);

sections.forEach((section) => {
  section.classList.add("reveal");
});

window.addEventListener("scroll", () => {
  sections.forEach((section) => {
    const top = section.getBoundingClientRect().top;

    if (top < window.innerHeight - 100) {
      section.classList.add("active");
    }
  });
});
