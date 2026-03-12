import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Generator = () => {
  const [schoolName, setSchoolName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [bmPercentage, setBmPercentage] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const { toast: showSuccess } = useToast();

  const generateCode = () => {
    const randomString = Math.random().toString(36).substring(2, 18).toUpperCase();
    const code = randomString + Math.random().toString(36).substring(2, 3).toUpperCase();
    setGeneratedCode(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!schoolName || !poNumber || !transactionAmount || !bmPercentage || !generatedCode) {
      toast.error("Please fill all fields and generate code first");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          school_name: schoolName,
          po_number: poNumber,
          transaction_amount: parseFloat(transactionAmount),
          bm_percentage: parseFloat(bmPercentage),
          code: generatedCode
        });

      if (error) {
        toast.error("Failed to save data: " + error.message);
        return;
      }

      showSuccess({
        title: "Success",
        description: "Data saved successfully!"
      });
      setSchoolName("");
      setPoNumber("");
      setTransactionAmount("");
      setBmPercentage("");
      setGeneratedCode("");
    } catch (error) {
      toast.error("An error occurred: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transaction Code Generator</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="schoolName">School Name</Label>
          <Input
            id="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="Enter school name"
          />
        </div>

        <div>
          <Label htmlFor="poNumber">PO Number</Label>
          <Input
            id="poNumber"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Enter PO number"
          />
        </div>

        <div>
          <Label htmlFor="transactionAmount">Transaction Amount</Label>
          <Input
            id="transactionAmount"
            type="number"
            value={transactionAmount}
            onChange={(e) => setTransactionAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div>
          <Label htmlFor="bmPercentage">% BM</Label>
          <Input
            id="bmPercentage"
            type="number"
            value={bmPercentage}
            onChange={(e) => setBmPercentage(e.target.value)}
            placeholder="Enter BM percentage"
          />
        </div>

        <div>
          <Label htmlFor="generatedCode">Generated Code</Label>
          <div className="flex items-center">
            <Input
              id="generatedCode"
              value={generatedCode}
              readOnly
              placeholder="Code will appear here"
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={generateCode}
              className="ml-2"
            >
              Generate Code
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full">Save Data</Button>
      </form>
    </div>
  );
};

export default Generator;