"use client";

import React, { useState } from 'react';
import { Download, Settings2, MapPin, Database } from 'lucide-react';

const INDIAN_FIRST_NAMES_MALE = ["Amit", "Rahul", "Sourav", "Bikram", "Rajesh", "Abhishek", "Rohan", "Snehasish", "Anik", "Sayan", "Arijit", "Debashis", "Sanjay", "Kunal", "Arindam", "Prakash", "Subhajit", "Rakesh", "Bishal"];
const INDIAN_FIRST_NAMES_FEMALE = ["Priya", "Sneha", "Anjali", "Riya", "Puja", "Shreya", "Aditi", "Kavita", "Nandini", "Susmita", "Priyanka", "Anushka", "Debjani", "Moumita", "Payel", "Rupa", "Sayantani", "Neha"];
const INDIAN_TITLES = ["Ghosh", "Das", "Bose", "Mitra", "Banerjee", "Chatterjee", "Mukherjee", "Roy", "Dutta", "Sen", "Sharma", "Singh", "Patel", "Mishra", "Gupta", "Kumar", "Chakraborty", "Saha", "Nandi", "Majumder", "Haldar", "Sarkar", "Chowdhury", "Karmakar", "Bhattacharya"];

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

export default function DummyDataGeneratorTool() {
    const [userCount, setUserCount] = useState<number>(50);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedState, setSelectedState] = useState<string>("Random");

    const [columns, setColumns] = useState({
        firstName: true,
        lastName: true,
        gender: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        postcode: true
    });

    const handleColumnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setColumns({
            ...columns,
            [e.target.name]: e.target.checked
        });
    };

    const generateAndDownloadExcel = async () => {
        if (userCount <= 0 || userCount > 5000) {
            alert("অনুগ্রহ করে ১ থেকে ৫০০০ এর মধ্যে একটি সংখ্যা দিন।");
            return;
        }

        if (!Object.values(columns).some(val => val === true)) {
            alert("অনুগ্রহ করে অন্তত একটি কলাম সিলেক্ট করুন।");
            return;
        }

        setIsLoading(true);
        try {
            // ডুপ্লিকেট এড়ানোর জন্য Set তৈরি করা হলো
            const generatedEmails = new Set();
            let csvContent = "";
            let generatedCount = 0;

            // হেডার তৈরি
            let headers = [];
            if (columns.firstName) headers.push("First Name");
            if (columns.lastName) headers.push("Last Name");
            if (columns.gender) headers.push("Gender");
            if (columns.email) headers.push("Email");
            if (columns.phone) headers.push("Phone");
            if (columns.city) headers.push("City");
            if (columns.state) headers.push("State");
            if (columns.country) headers.push("Country");
            if (columns.postcode) headers.push("Postcode");
            
            csvContent += headers.join(",") + "\n";

            // যতগুলো ইউনিক ডেটা দরকার, ততগুলো না পাওয়া পর্যন্ত লুপ চলবে
            while (generatedCount < userCount) {
                // API-এর রিকোয়েস্টের পরিমাণ কমানোর জন্য একসাথে কিছু ডেটা নিয়ে আসছি
                const batchSize = Math.min(50, userCount - generatedCount);
                const response = await fetch(`https://randomuser.me/api/?results=${batchSize}&nat=in`);
                const data = await response.json();
                const users = data.results;

                for (let i = 0; i < users.length; i++) {
                    const user = users[i];
                    const isMale = user.gender === 'male';
                    const realFirstName = isMale 
                        ? INDIAN_FIRST_NAMES_MALE[Math.floor(Math.random() * INDIAN_FIRST_NAMES_MALE.length)]
                        : INDIAN_FIRST_NAMES_FEMALE[Math.floor(Math.random() * INDIAN_FIRST_NAMES_FEMALE.length)];
                    const realLastName = INDIAN_TITLES[Math.floor(Math.random() * INDIAN_TITLES.length)];
                    
                    const randomNum = Math.floor(Math.random() * 9999);
                    const realEmail = `${realFirstName.toLowerCase()}.${realLastName.toLowerCase()}${randomNum}@gmail.com`;

                    // ডুপ্লিকেট ইমেইল চেক করা হচ্ছে
                    if (generatedEmails.has(realEmail)) {
                        continue; // যদি ইমেইল আগে থেকেই থাকে, তাহলে এই লুপটি স্কিপ করে পরেরটায় যাবে
                    }

                    // ইউনিক ইমেইল পাওয়া গেলে সেটি Set-এ সেভ করা হচ্ছে
                    generatedEmails.add(realEmail);
                    generatedCount++;

                    let row = [];
                    if (columns.firstName) row.push(realFirstName);
                    if (columns.lastName) row.push(realLastName);
                    if (columns.gender) row.push(user.gender);
                    if (columns.email) row.push(realEmail);
                    if (columns.phone) row.push(user.phone);
                    if (columns.city) row.push(user.location.city);
                    
                    if (columns.state) {
                        row.push(selectedState === "Random" ? user.location.state : selectedState);
                    }
                    
                    if (columns.country) row.push("India");
                    if (columns.postcode) row.push(user.location.postcode);

                    const safeRow = row.map(item => `"${item}"`);
                    csvContent += safeRow.join(",") + "\n";

                    // যদি কাঙ্ক্ষিত পরিমাণ ডেটা তৈরি হয়ে যায়, তাহলে লুপ ভেঙে বেরিয়ে আসবে
                    if (generatedCount >= userCount) break;
                }
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Unique_Indian_Data_${userCount}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Error generating data:", error);
            alert("ডেটা জেনারেট করতে সমস্যা হয়েছে।");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Database className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Indian Dummy Data Generator
                </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 ml-14">
                টেস্টিংয়ের জন্য একদম ইউনিক, রিয়েলিস্টিক নাম এবং আপনার পছন্দের কলাম দিয়ে ইন্ডিয়ান ডামি ডেটা তৈরি করুন।
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            ডেটার পরিমাণ (Row Count)
                        </label>
                        <input 
                            type="number" 
                            value={userCount}
                            onChange={(e) => setUserCount(Number(e.target.value))}
                            min="1"
                            max="5000"
                            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 transition-all"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            নির্দিষ্ট স্টেট (State)
                        </label>
                        <select 
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 transition-all"
                        >
                            <option value="Random">Mix (All Indian States)</option>
                            {INDIAN_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700/50">
                        <Settings2 className="w-4 h-4 text-slate-400" />
                        কলাম সিলেক্ট করুন (Columns)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(columns).map(([key, isChecked]) => (
                            <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    name={key}
                                    checked={isChecked}
                                    onChange={handleColumnChange}
                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                    onClick={generateAndDownloadExcel}
                    disabled={isLoading}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 py-3 px-8 rounded-xl text-white font-semibold transition-all shadow-md ${
                        isLoading 
                            ? 'bg-indigo-400 dark:bg-indigo-600/50 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                >
                    <Download className={`w-5 h-5 ${isLoading ? 'animate-bounce' : ''}`} />
                    {isLoading ? 'Generating Data...' : 'Download Unique Indian Data (CSV)'}
                </button>
            </div>
        </div>
    );
}