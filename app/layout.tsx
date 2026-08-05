import "./globals.css";

export const metadata = {
  title: "Güstener Zapfhahn Zentrale",
  description: "Events, Getränke, Kosten und Rankings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
