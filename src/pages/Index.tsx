import { MadeWithDyad } from "@/components/made-with-dyad";
import Generator from "./Generator";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Transaction Code Generator</h1>
        <Generator />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;