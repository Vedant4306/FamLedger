package com.vedbuk.famledgerapp.Service;

import com.vedbuk.famledgerapp.Entity.Transaction;
import com.vedbuk.famledgerapp.Repository.TransactionRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExportService {

    private final TransactionRepository transactionRepository;

    public ExportService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public ByteArrayInputStream exportTransactionsToExcel(Long userId) throws IOException {
        List<Transaction> transactions = transactionRepository.findByAccountOwnerId(userId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Transactions Statement");

            // Header Row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Tx ID", "Date", "Type", "Category", "Description", "Amount ($)"};

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Populate Rows
            int rowIdx = 1;
            for (Transaction tx : transactions) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(tx.getId());
                row.createCell(1).setCellValue(tx.getTransactionDate().toString());
                row.createCell(2).setCellValue(tx.getType());
                row.createCell(3).setCellValue(tx.getCategory());
                row.createCell(4).setCellValue(tx.getDescription());
                row.createCell(5).setCellValue(tx.getAmount().doubleValue());
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}