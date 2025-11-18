import { APP_NAME } from "@/lib/constants";

const Hero = () => {
    return ( 
        <div className="flex justify-center items-center h-64">
            <h1 className="text-2xl font-bold text-blue-200">{APP_NAME}</h1>
        </div>
     );
}
 
export default Hero;