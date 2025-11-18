import Image from "next/image";
import Link from "next/link";
import Menu from "./menu";
import CategoryDrawer from './category-drawer';

const Header = () => {
    return ( 
    <header className="w-full">
      <div className="wrapper flex-between">
        <div className="flex-start">
            <Link href='/' className="flex-start">
            <CategoryDrawer />
               <div className="relative w-36 h-36">
                 <Image src='/images/2.svg' fill className="object-contain" alt="Rocken My Vibe Logo"    priority={true}
                 />
               </div>
               {/* <span className="hidden lg:block font-bold text-2xl ml-3">{APP_NAME}</span> */}
            </Link>
        </div>

        <div className="hidden md:flex items-center justify-center text-white">
          <Link href='/' className="m-2.5 hover:text-black hover:underline">Home</Link>
          <Link href='/about' className="m-2.5 hover:text-black hover:underline">About</Link>
          <Link href='/blog' className="m-2.5 hover:text-black hover:underline">Blog</Link>
          <Link href='/contact' className="m-2.5 hover:text-black hover:underline">Contact</Link>
          <Link href='/products' className="m-2.5 hover:text-black hover:underline">Products</Link>
        </div>
           <Menu />
      </div>
    </header> 
 );
}
 
export default Header;
