let slides = document.querySelectorAll(".hero-slide");
let index = 0;

function showSlide(i){

slides.forEach(slide=>slide.classList.remove("active"));

slides[i].classList.add("active");

}

document.querySelector(".next").onclick = () =>{

index++;

if(index >= slides.length)
index=0;

showSlide(index);

}

document.querySelector(".prev").onclick = () =>{

index--;

if(index < 0)
index=slides.length-1;

showSlide(index);

}


setInterval(()=>{

index++;

if(index >= slides.length)
index=0;

showSlide(index);

},5000);
