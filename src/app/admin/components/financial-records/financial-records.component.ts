import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-financial-records',
  imports: [CommonModule],
  templateUrl: './financial-records.component.html',
  styleUrls: ['./financial-records.component.css']
})
export class FinancialRecordsComponent {
  academicYears = [
    { id: 1, name: '2022/2023' },
    { id: 2, name: '2023/2024' }
  ];

  payments = [
    {
      student: 'student1',
      academic_year: { id: 1, name: '2022/2023' },
      date: new Date('2022-11-03'),
      type: 'Receipt',
      payment_type: 'Tuition Fees-Undergraduate',
      remark: 'Private',
      reference_no: '922307136497187',
      fee: 82500,
      payment: 82500,
      balance: -82500
    },
    {
      student: 'student1',
      academic_year: { id: 1, name: '2022/2023' },
      date: new Date('2022-12-31'),
      type: 'Bill',
      payment_type: 'Tuition Fees-Undergraduate',
      remark: 'Standard Bill',
      reference_no: '',
      fee: 600000,
      payment: 0,
      balance: 11750
    },
    {
      student: 'student1',
      academic_year: { id: 1, name: '2022/2023' },
      date: new Date('2022-11-03'),
      type: 'Receipt',
      payment_type: 'Tuition Fees-Undergraduate',
      remark: 'Private',
      reference_no: '922307136497187',
      fee: 82500,
      payment: 82500,
      balance: -82500
    },

  ];

  otherPayments = [
    {
      student: 'student1',
      academic_year: { id: 1, name: '2022/2023' },
      date: new Date('2022-11-03'),
      type: 'Receipt',
      payment_type: 'Quality Assurance Collection',
      remark: 'Private',
      reference_no: '922307136498398',
      fee: 20000,
      payment: 20000,
      balance: -364500
    },
    {
      student: 'student1',
      academic_year: { id: 1, name: '2022/2023' },
      date: new Date('2022-12-31'),
      type: 'Bill',
      payment_type: 'Health Services Income',
      remark: 'Standard Bills',
      reference_no: '',
      fee: 10000,
      payment: 0,
      balance: -374500
    },
    // Add more records as needed
  ];

  // Filter payments by academic year id
  getPaymentsForYear(yearId: number) {
    return this.payments.filter(p => p.academic_year.id === yearId);
  }

  getOtherPaymentsForYear(yearId: number) {
    return this.otherPayments.filter(p => p.academic_year.id === yearId);
  }
  
}
