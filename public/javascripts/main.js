/**
 * Header, Footer and Site Navigation custom HTML elements for the app.
 * @author Bryan Haberberger
 */ 

class DLAPublicFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            gm-footer{
                display: block;
                text-align: center;
                background-color: var(--site-light);
                z-index: 1;
                position: fixed;
                bottom: 0;
                width: 100%;
            }

            gm-footer .brand{
                height: 2em;
                margin-right: 5px;
            }

            gm-footer a{
                text-decoration: none;
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-align: center;
                -ms-flex-align: center;
                align-items: center;
                padding: 1rem 2rem;
                color: var(--color-darkGrey);
            }

            gm-footer div {
                display: inline-flex;
            }
        </style>
        <gm-footer>
            <div>
                <a target="_blank" href="https://www.slu.edu/research/faculty-resources/research-computing.php">
                    <img class="brand" src="../images/rcg-logo.jpg"> 
                    ©2022 Research Computing Group
                </a>
            </div>
            <div>
                <a target="_blank" href="https://www.slu.edu/research/faculty-resources/research-computing.php">
                    <img class="brand" src="https://www.slu.edu/marcom/tools-downloads/imgs/logo/left-aligned/slu_logoleftaligned_rgb.png">
                    Saint Louis University
                </a>
            </div>
        </gm-footer>
        `
        this.classList.add('nav', 'nav-center', 'text-primary', 'is-fixed', 'is-full-width', 'is-vertical-align')
    }
}
customElements.define("dla-footer", DLAPublicFooter)

class DLAPublicHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            gm-header{
              display: block;
              height:  10em !important;
              overflow:  hidden;
              margin-bottom:  2em;
              border-bottom:  2px solid black;
              margin-top:  1em;
              overflow: hidden !important;
            }

            gm-header h1 {
              text-shadow: .025em .075em .05em var(--shade);
              color: var(--accent);
              font-size: 4rem;
              font-family: 'Homemade Apple', cursive;
            }

            gm-header.small {
              margin: calc(var(--body-padding) * -1) 0 0px;
              height: 75px;
            }

            gm-header.small h1 {
              font-size: 2rem;
            }

            logoimg img {
              position: relative;
              width: 93%;
              left: 7%;
              z-index: -1;
            }

            paul{
              position:  absolute;
            }

            paul img{
              height: 10em;
            }
        </style>
        <gm-header class="small">
            <paul>
                <img src="https://cdm16007.contentdm.oclc.org/iiif/2/p267401coll32:4553/100,0,1100,1100/150,150/0/default.jpg">
            </paul>
            <logoimg>
                <img src="" alt="logo">    
            </logoimg>
        </gm-header>
        <nav class="tabs">
            <a href="/" class="">Home</a>
            <a href="/collections">Collections</a>
            <a href="/browse" class="">Browse</a>
            <a href="/about" class="">About</a>
        </nav>
        `
        this.querySelector(`.tabs a[href*="${location.pathname.replaceAll('/', '')}"]`).classList.add("active")
        this.querySelector(`logoimg img`).setAttribute("src", `../images/logo-${location.pathname.replaceAll('/', '')}.jpg`)
    }
}
customElements.define("dla-header", DLAPublicHeader)
