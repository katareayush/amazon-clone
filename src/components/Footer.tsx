import Link from "next/link";
import Logo from "./Logo";

const COLUMNS: [string, [string, string][]][] = [
  ["Get to Know Us", [["About this project", "https://github.com/katareayush/amazon-clone"], ["Product notes", "https://github.com/katareayush/amazon-clone/blob/main/docs/PRODUCT-NOTES.md"]]],
  ["Shop", [["Today's Deals", "/s?deals=1"], ["Smartphones", "/s?i=smartphones"], ["Laptops", "/s?i=laptops"], ["Beauty", "/s?i=beauty"]]],
  ["Let Us Help You", [["Your Orders", "/orders"], ["Your Cart", "/cart"], ["Returns & Replacements", "/orders"]]],
];

export default function Footer() {
  return (
    <footer className="mt-8 text-white">
      <a href="#" className="block bg-nav-3 py-4 text-center text-[13px] hover:bg-[#485769]">
        Back to top
      </a>
      <div className="bg-nav-2 px-4 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          {COLUMNS.map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-2 font-bold">{title}</h3>
              <ul className="space-y-1.5 text-sm text-gray-300">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:underline">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 bg-nav px-4 py-8 text-center text-xs text-gray-300">
        <Logo />
        <p>Demo rebuild for a 24-hour assignment. Not affiliated with Amazon.com, Inc. No real orders or payments.</p>
        <p>Product data from DummyJSON.</p>
      </div>
    </footer>
  );
}
