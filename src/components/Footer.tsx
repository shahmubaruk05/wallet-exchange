import React from "react";

const Footer = () => {
  return (
    <footer className="bg-muted/40 py-4">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Wallet XChanger. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
