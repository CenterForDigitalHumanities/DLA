/**
 * Header, Footer and Site Navigation custom HTML elements for the app.
 * @author Bryan Haberberger
 */ 

class DLAPublicFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer class="bg-dark text-center text-white">
            <!-- Grid container -->
            <div class="container p-4">
                <!-- Section: Text -->
                <section class="mb-4">
                <p class="text-start">
                    Funding and support provided by the National Endowment for the Humanities, Mellon Foundation, 
                    and University of Dayton. The Dunbar Library & Archive web platform has been developed by the 
                    Research Computing Group at Saint Louis University and is edited by Dr. Minnita Daniel-Cox.
                </p>
                </section>
                <!-- Section: Text -->

                <!-- Section: Links -->
                <section class="">
                <!--Grid row-->
                <div class="row justify-content-center">
                    <!--Grid column-->
                    <div class="col-lg-4 col-md-6 mb-4 mb-md-0 text-start">
                    <h5 class="scrip">Dunbar Library & Archive</h5>

                    <ul class="list-unstyled mb-0">
                        <li>
                        <a href="/collections" class="text-white">View all Collections</a>
                        </li>
                        <li>
                        <a href="/about" class="text-white">About the archive</a>
                        </li>
                        <li>
                        <a href="/contributors" class="text-white">Contributions</a>
                        </li>
                    </ul>
                    </div>
                    <!--Grid column-->

                    <!--Grid column-->
                    <div class="col-lg-4 col-md-6 mb-4 mb-md-0 text-start">
                    <h5 class="text-uppercase">Related Resources</h5>

                    <ul class="list-unstyled mb-0">
                        <li>
                        <a href="https://udayton.edu/artssciences/academics/music/dunbar/index.php" class="text-white">Paul Laurence Dunbar Music Archive</a>
                        </li>
                        <li>
                        <a href="https://youtu.be/mCXn9YIYjNs" class="text-white">Dunbar Initiative at UD trailer</a>
                        </li>
                        <li>
                        <a href="https://archive.org/search?query=Paul+Dunbar+poet&and%5B%5D=subject%3A%22Dunbar%2C+Paul+Laurence%2C+1872-1906%22" class="text-white">Internet Archive books</a>
                        </li>
                    </ul>
                    </div>
                    <!--Grid column-->

                </div>
                <!--Grid row-->
                </section>
                <!-- Section: Links -->
            </div>
            <!-- Grid container -->

            <!-- Copyright -->
            <div class="text-center p-3" style="background-color: rgba(0, 0, 0, 0.2);">
                © 2023 Copyright:
                <a class="text-white" href="https://udayton.edu/">University of Dayton</a>
                <p>
                    <small>
                    Linked records held at external repositories may have rights or restrictions in addition to what is 
                    offered by the DLA.
                    </small>
                </p>
            </div>
            <!-- Copyright -->
            </footer>
        `
        this.classList.add('is-fixed', 'is-full-width', 'is-vertical-align')
    }
}
customElements.define("dla-footer", DLAPublicFooter)

class DLAPublicHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            .navbar-brand .scrip {
                font-family: 'Homemade Apple', cursive;
                text-shadow: 0 0 1.5px var(--ud-secondary);
            }

            header{
              display: flex;
              justify-items: stretch;
              height:  10em;
              overflow:  hidden;
              margin-bottom:  2em;
              border-bottom:  2px solid black;
              margin-top:  1em;
              position:relative;
            }

            header h1 {
              text-shadow: 0 0 1.5px var(--ud-secondary);
              color: var(--ud-blue);
              font-size: 4rem;
              font-family: 'Homemade Apple', cursive;
              text-align: center;
                flex-grow: 4;
                align-self: center;
            }

            header.small {
              height: 75px;
            }

            header.small h1 {
              font-size: 2rem;
            }

            logoimg {
                overflow:hidden;
                position:absolute;
                height:100%;
                left: 0;
                width: 100vw;
            }

            logoimg img {
              position: relative;
              z-index: -1;
            }
            a:has(img.paul){
                z-index:1;
            }
            img.paul{
              height: 140%;
              margin: -20%;
              box-shadow: -2px 2px 5px var(--ud-secondary);
              border-bottom-right-radius: 25%;
              border-bottom-left-radius: 25%;
            }
        </style>
        <!--<header class="small">
            <a href="/" title="Home">
                <img class="paul" src="https://cdm16007.contentdm.oclc.org/iiif/2/p267401coll32:4553/100,0,1100,1100/150,150/0/default.jpg">
            </a>
            <logoimg>
                <img src="" alt="logo">    
            </logoimg>
            <h1>Dunbar Library & Archive</h1>
        </header>
        <nav class="tabs">
            <a href="/collections">Collections</a>
            <a href="/browse" class="">Browse</a>
            <a href="/about" class="">About</a>
        </nav> -->
        <nav class="navbar bg-light">
            <div class="container-fluid">
                <a href="/" class="navbar-brand" title="Home">
                    <img src="https://cdm16007.contentdm.oclc.org/iiif/2/p267401coll32:4553/100,0,1100,1100/50,50/0/default.jpg">
                    <span class="scrip">Dunbar Library & Archive</span>
                </a>
            </div>
        </nav>
        `
        this.querySelector(`.tabs a[href*="${location.pathname.split('/')[1]}"]`)?.classList.add("active")
        this.querySelector(`logoimg img`)?.setAttribute("src", `/images/logo-${location.pathname.split('/')[1].replace(".html","")}.jpg`)
    }
}
customElements.define("dla-header", DLAPublicHeader)

class DLAPublicCarousel extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <div id="carouselExampleDark" class="carousel carousel-dark slide" data-bs-ride="carousel">
        <div class="carousel-inner">
          <div class="carousel-item active" data-bs-interval="10000">
            <img src="..." class="d-block w-100" alt="...">
            <div class="carousel-caption d-none d-md-block">

            </div>
          </div>
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Previous</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Next</span>
        </button>
      </div>`

      fetch(this.getAttribute('src'))
        .then(res=>res.json())
        .then(list => {
            let itemBuilder =``
            list.forEach((item,index)=>{
                new URL(item.id) // break if not retrievable
                itemBuilder += `
                <div class="carousel-item${index===0?" active":""}" data-bs-interval="10000">
                    <img src="${item.id}" class="d-block w-100" alt="">
                    <div class="carousel-caption d-none d-md-block">
                        <p>${item.description}</p>
                    </div>
                </div>
                `
            })
            this.querySelector('.carousel-inner').innerHTML = itemBuilder
        })
        .catch(err=> this.remove())
    }
}
customElements.define("dla-carousel", DLAPublicCarousel)
