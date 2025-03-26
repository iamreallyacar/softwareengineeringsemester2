import React, { useState, useEffect } from "react";
import { Menu, Facebook, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import "../css/landing-page.css";

// Utility function for consistent scrolling behavior
const scrollToElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) {
    const navbarHeight = 70; // Match the padding-top in CSS
    window.scrollTo({
      top: element.offsetTop - navbarHeight,
      behavior: "smooth",
    });
  }
};

// Navbar Component
function Navbar() {
  const [isSticky, setIsSticky] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId) => {
    scrollToElement(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isSticky ? "sticky" : ""}`}>
      <div className="container">
        <div className="content-container navbar-content">
          <Link to="/landing-page" className="logo">
            Peaches Smart Home
          </Link>

          <div className="menu-toggle">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
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
            <Link to="/create-account" className="sign-up-btn">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Hero Component
function Hero() {
  const scrollToAbout = () => {
    scrollToElement("about");
  };

  return (
    <section id="home" className="hero">
      <div className="hero-overlay"></div>
      <div className="container">
        <div className="content-container hero-content">
          <h1>Welcome to Peaches Smart Home System</h1>
          <p>Your affordable solution to Control and Monitor your home.</p>
          <button
            onClick={scrollToAbout}
            className="btn-primary"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}

// About Component
function About() {
  return (
    <section id="about" className="about">
      <div className="container">
        <div className="content-container">
          <div className="section-header">
            <h2>About Us</h2>
            <div className="divider"></div>
            <p>Learn more about our company and what makes us different.</p>
          </div>

          <div className="about-content">
            <div className="about-image">
              <img src="/images/placeholder.jpg" alt="About Us" />
            </div>
            <div className="about-text">
              <h3>Our Story</h3>
              <p>
                Peaches Smart Home is a smart monitoring solution designed to optimize energy usage, track resource consumption, and enhance sustainability in net-zero homes and care facilities.
              </p>
              <p>
                By integrating IoT sensors, AI-driven analytics, and real-time data visualization, the system enables homeowners and facility managers to monitor solar energy generation, water usage, indoor air quality, and overall energy efficiency.
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
      </div>
    </section>
  );
}

// Contact Component
function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      console.log("Form submitted:", formData);
      setSuccess("Thank you for your message! We'll get back to you soon.");

      // Clear form after submission
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSuccess("An error occurred. Please try again later.");
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="contact-inner">
        <div className="content-container">
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
                    <p>1, Jalan Venna P5/2, Precinct 5, 62200 Putrajaya, Wilayah Persekutuan Putrajaya</p>
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
                    <p>support@peaches.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              <div className="contact-card">
                <h3>Send Us a Message</h3>

                {success && <p className="success">{success}</p>}

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
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  const currentYear = new Date().getFullYear();

  const handleSocialClick = (e) => {
    e.preventDefault();
    // Social media link handler would go here
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Newsletter subscription logic would go here
    console.log("Newsletter subscription submitted");
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="content-container footer-content">
          <div className="footer-section">
            <h3>Modern Smart Home</h3>
            <p>Your affordable solution to Control and Monitor your home.</p>
            <div className="social-links">
              <a href="#" onClick={handleSocialClick} className="social-link" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" onClick={handleSocialClick} className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" onClick={handleSocialClick} className="social-link" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" onClick={handleSocialClick} className="social-link" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li>
                <a href="#home" onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('home');
                }}>Home</a>
              </li>
              <li>
                <a href="#about" onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('about');
                }}>About</a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('contact');
                }}>Contact</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Newsletter</h3>
            <p>Subscribe to our newsletter to receive updates and news.</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input type="email" placeholder="Your email" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="content-container footer-bottom">
          <p>&copy; {currentYear} Peaches Smart Home. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// Main LandingPage Component
function LandingPage() {
  useEffect(() => {
    // Ensure the page starts at the top when loaded
    window.scrollTo(0, 0);
    document.body.style.overflow = "auto";
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <main className="landing-page">
      <Navbar />
      <Hero />
      <About />
      <Contact />
      <Footer />
    </main>
  );
}

export default LandingPage;