import { useState, useEffect } from "react"
import { Menu, Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react"
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

// Navbar Component
function Navbar() {
  const [isSticky, setIsSticky] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId)
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 70,
        behavior: "smooth",
      })
    }
    setIsMenuOpen(false)
  }

  return (
    <nav className={`navbar ${isSticky ? "sticky" : ""}`}>
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo">
            ModernSite
          </Link>

          <div className="menu-toggle">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>

          <div className={`nav-links ${isMenuOpen ? "open" : ""}`}>
            <button onClick={() => scrollToSection("home")} className="nav-link">
              Home
            </button>
            <button onClick={() => scrollToSection("about")} className="nav-link">
              About
            </button>
            <button onClick={() => scrollToSection("contact")} className="nav-link">
              Contact
            </button>
            <Link to="/signup" className="sign-up-btn">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

// Hero Component
function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-overlay"></div>
      <div className="container">
        <div className="hero-content">
          <h1>Welcome to Our Modern Website</h1>
          <p>A clean, responsive design built with React</p>
          <button
            onClick={() => {
              const aboutSection = document.getElementById("about")
              if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: "smooth" })
              }
            }}
            className="btn-primary"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}

// About Component
function About() {
  return (
    <section id="about" className="about">
      <div className="container">
        <div className="section-header">
          <h2>About Us</h2>
          <div className="divider"></div>
          <p>Learn more about our company and what makes us different.</p>
        </div>

        <div className="about-content">
          <div className="about-image">
            <img src="/placeholder.svg?height=400&width=600" alt="About Us" />
          </div>
          <div className="about-text">
            <h3>Our Story</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at eros euismod, finibus nunc ac, volutpat
              metus. Vivamus eget mauris in nisi efficitur maximus vel in magna.
            </p>
            <p>
              Praesent dignissim, justo non aliquam feugiat, lorem urna lobortis nulla, id facilisis eros lorem eu
              mauris. Fusce vitae risus sed nisi scelerisque sollicitudin.
            </p>
            <div className="about-boxes">
              <div className="about-box">
                <h4>Our Mission</h4>
                <p>To provide exceptional service and innovative solutions.</p>
              </div>
              <div className="about-box">
                <h4>Our Vision</h4>
                <p>To become the industry leader in our field.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Contact Component
function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would typically send the form data to your backend
    console.log("Form submitted:", formData)
    alert("Thank you for your message! We'll get back to you soon.")
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
  }

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="section-header">
          <h2>Contact Us</h2>
          <div className="divider"></div>
          <p>Get in touch with us for any questions or inquiries.</p>
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-card">
              <h3>Contact Information</h3>

              <div className="contact-item">
                <MapPin className="icon" />
                <div>
                  <h4>Our Location</h4>
                  <p>123 Business Street, Suite 100, City, State 12345</p>
                </div>
              </div>

              <div className="contact-item">
                <Phone className="icon" />
                <div>
                  <h4>Phone Number</h4>
                  <p>(123) 456-7890</p>
                </div>
              </div>

              <div className="contact-item">
                <Mail className="icon" />
                <div>
                  <h4>Email Address</h4>
                  <p>info@yourcompany.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-container">
            <div className="contact-card">
              <h3>Send Us a Message</h3>

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Your Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>ModernSite</h3>
            <p>A modern website template built with React, providing a clean and responsive design.</p>
            <div className="social-links">
              <a href="#" className="social-link">
                <Facebook size={20} />
              </a>
              <a href="#" className="social-link">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
              <li>
                <Link to="/signup">Sign Up</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Newsletter</h3>
            <p>Subscribe to our newsletter to receive updates and news.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Your email" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} ModernSite. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// Main App Component
export default function LandingPage() {
  return (
    <main className="landing-page">
      <Navbar />
      <Hero />
      <About />
      <Contact />
      <Footer />
    </main>
  )
}