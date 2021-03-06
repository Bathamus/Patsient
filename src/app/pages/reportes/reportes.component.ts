import { Component, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ReportesService } from 'src/app/services/reportes.service';
import { PacienteService } from 'src/app/services/paciente.service';

import * as jsPDF from 'jspdf';
import 'jspdf-autotable';

import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

declare const $: any;

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ReportesComponent implements OnInit {

  withDetalles = false;

  empleado = null;
  cliente = null;

  actualClienteNombre = null;
  actualEmpleadoNombre = null;

  pacientes: any = [];
  empleados: any = [];

  since: Date = new Date(2019, 0, 1);
  until: Date = new Date(2019, 11, 31);
  dataSource: Servicio[] = [];
  columnsToDisplay = ['id', 'fecha', 'fisioterapeuta', 'paciente', 'subcategoria', 'presupuesto'];
  expandedElement: Servicio | null;

  // Para el modal buscar empleado
  empNombre: String = null;
  empApellido: String = null;
  empSeleccionado = null;
  empCantidad: Number = 0;

  // Para el modal buscar paciente
  pacNombre: String = null;
  pacApellido: String = null;
  pacSeleccionado = null;
  pacCantidad: Number = 0;

  constructor(private service: ReportesService, private pacienteService: PacienteService) { }

  ngOnInit() {
    this.getData();
    this.service.get_clientes().subscribe((res: any) => (
      this.pacientes = res['lista']
    ));
    this.service.get_empleados().subscribe((res: any) => (
      this.empleados = res['lista']
    ));
  }

  getData() {
    let since = this.format_date(this.since);
    let until = this.format_date(this.until);

    this.service.all(since, until, this.empleado, this.cliente).subscribe(response => {
      let data: Servicio[] = [];
      for (let k in response['lista']) {
        let s = response['lista'][k];
        data.push({
          id: s.idServicio,
          fecha: s.fechaHora,
          fisioterapeuta: s.idEmpleado.apellido + ", " + s.idEmpleado.nombre,
          fisio_apellido: s.idEmpleado.apellido,
          fisio_nombre: s.idEmpleado.apellido,
          paciente: s.idFichaClinica.idCliente.apellido + ", " + s.idFichaClinica.idCliente.nombre,
          paciente_apellido: s.idFichaClinica.idCliente.apellido,
          paciente_nombre: s.idFichaClinica.idCliente.nombre,
          presupuesto: s.presupuesto,
          subcategoria: s.idFichaClinica.idTipoProducto.descripcion,
          detalles: []
        });
      }
      this.dataSource = data;
      if (this.withDetalles) {
        this.get_detalles();
      }
    });
  }

  format_date(date: Date) {
    let ret = date.toISOString().substring(0, 10);
    return ret.replace("-", "").replace("-", "");
  }

  setCliente(cliente: any) {
    this.cliente = cliente['idPersona'];
    this.actualClienteNombre = cliente['nombre'];
    this.getData();
  }
  setEmpleado(empleado: any) {
    this.empleado = empleado['idPersona'];
    this.actualEmpleadoNombre = empleado['nombre'];
    this.getData();
  }

  generate_PDF() {
    let pdf = new jsPDF();
    let head = [];
    let body = [];

    for (let i = 0; i < this.dataSource.length; i++) {
      let row: String[] = []
      for (let k = 0; k < this.columnsToDisplay.length; k++) {
        let j = this.columnsToDisplay[k]
        row.push(this.dataSource[i][j] + "");
      }
      body.push(row);

      if (this.withDetalles && this.dataSource[i].detalles.length > 0) {
        body.push([
          '', 'Presentacion', 'Cantidad', 'Precio Unitario', 'Sub Total', ''
        ])
        for (let j = 0; j < this.dataSource[i].detalles.length; j++) {
          let det = this.dataSource[i].detalles[j];
          body.push([
            '',
            det.presentacion,
            det.cantidad,
            det.precio_unitario,
            det.sub_total
          ]);
        }
      }
    }

    for (let k = 0; k < this.columnsToDisplay.length; k++) {
      let j = this.columnsToDisplay[k];
      j = j.substring(0, 1).toUpperCase() + j.substring(1);
      head.push(j);
    }


    pdf.text('Resumen de servicios', 45, 10)

    pdf.autoTable({
      styles: {
        theme: 'grid'
      },
      head: [head],
      body: body
    });
    // Save the PDF
    let url = pdf.output('bloburl');
    window.open(url, '_blank');
  }

  generate_XLS() {

    let head: String[] = [];
    let body: String[][] = [
      ['', 'Reportes de Servicios'],
    ];

    for (let k = 0; k < this.columnsToDisplay.length; k++) {
      let j = this.columnsToDisplay[k];
      j = j.substring(0, 1).toUpperCase() + j.substring(1);
      head.push(j);
    }

    body.push(head);

    for (let i = 0; i < this.dataSource.length; i++) {
      let row: String[] = [];
      for (let k = 0; k < this.columnsToDisplay.length; k++) {
        let j = this.columnsToDisplay[k];
        row.push(this.dataSource[i][j] + "");
      }
      body.push(row);

      if (this.withDetalles && this.dataSource[i].detalles.length > 0) {
        body.push([
          '', 'Presentacion', 'Cantidad', 'Precio Unitario', 'Sub Total', ''
        ]);
        for (let j = 0; j < this.dataSource[i].detalles.length; j++) {
          let det = this.dataSource[i].detalles[j];
          body.push([
            '',
            det.presentacion,
            det.cantidad + "",
            det.precio_unitario + "",
            det.sub_total + ""
          ]);
        }
      }
    }

    let excelFileName = "Reporte de Servicios";
    let worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(body);
    worksheet['!cols'] = [
      { wpx: 25 },
      { wpx: 120 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
    ];


    let workbook: XLSX.WorkBook = {
      Sheets: { 'data': worksheet },
      SheetNames: ['data']
    };
    let excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    this.saveAsExcelFile(excelBuffer, excelFileName);
  }
  private saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_EXTENSION = ".xlsx";
    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }



  get_detalles() {
    let i;
    for (i = 0; i < this.dataSource.length; i++) {
      this.get_detalle(i);
    }
  }
  private get_detalle(i) {
    this.service.detalle(this.dataSource[i].id).subscribe((response: any) => {

      for (let k in response) {
        let d = response[k];
        let q = Number(d.cantidad);
        let id = d.idPresentacionProducto.idPresentacionProducto;
        this.dataSource[i].detalles.push({
          presentacion: d.idPresentacionProducto.nombre,
          precio_unitario: null,
          cantidad: q,
          sub_total: null
        })
        this.get_unit_price(i, this.dataSource[i].detalles.length - 1, id);
      }
    });
  }

  private get_unit_price(i, j, id) {
    this.service.price(id).subscribe((response) => {
      if (response['lista'].length > 0) {
        let p = Number(response['lista'][0].precioVenta);
        let q = this.dataSource[i].detalles[j].cantidad;
        this.dataSource[i].detalles[j].precio_unitario = p;
        this.dataSource[i].detalles[j].sub_total = p * q;
      }
    })
  }

  openEmpleado() {
    this.empNombre = null;
    this.empApellido = null;
    this.empSeleccionado = null;
    this.pacienteService.filtrarEmpleados().subscribe((res: any) => {
      this.empleados = res['lista'];
      this.empCantidad = res['totalDatos'];
      $('#empleadoModal').modal('show');
    });
  }

  buscarEmpleado() {
    this.pacienteService.filtrarEmpleados(this.empNombre, this.empApellido).subscribe((res: any) => {
      this.empleados = res['lista'];
      this.empCantidad = res['totalDatos'];
    });
  }

  selectEmpleado(empleado) {
    this.empSeleccionado = empleado['idPersona'];
    this.actualEmpleadoNombre = empleado['nombre'];
    this.empleado = this.empSeleccionado;
    this.getData();
    $('#empleadoModal').modal('hide');
  }

  closeEmpleado() {
    this.empNombre = null;
    this.empApellido = null;
    this.empSeleccionado = null;
    $('#empleadoModal').modal('hide');
  }

  openPaciente() {
    this.pacNombre = null;
    this.pacApellido = null;
    this.pacSeleccionado = null;
    this.pacienteService.filtrarPacientes().subscribe((res: any) => {
      this.pacientes = res['lista'];
      this.pacCantidad = res['totalDatos'];
      $('#pacienteModal').modal('show');
    });
  }

  buscarPaciente() {
    this.pacienteService.filtrarPacientes(this.pacNombre, this.pacApellido).subscribe((res: any) => {
      this.pacientes = res['lista'];
      this.pacCantidad = res['totalDatos'];
    });
  }

  selectPaciente(paciente) {
    this.pacSeleccionado = paciente['idPersona'];
    this.actualClienteNombre = paciente['nombre'];
    this.cliente = this.pacSeleccionado;
    this.pacSeleccionado = null;
    this.getData();
    $('#pacienteModal').modal('hide');
  }

  closePaciente() {
    this.pacNombre = null;
    this.pacApellido = null;
    this.pacSeleccionado = null;
    $('#pacienteModal').modal('hide');
  }

  limpiarFiltros() {
    this.empleado = null;
    this.cliente = null;
    this.actualClienteNombre = null;
    this.actualEmpleadoNombre = null;
    this.getData();
  }

}

interface Servicio {
  id: number;
  fecha: string;
  fisioterapeuta: string;
  fisio_apellido: string;
  fisio_nombre: string;
  paciente: string;
  paciente_apellido: string;
  paciente_nombre: string;
  presupuesto: string;
  subcategoria: string;
  detalles?: Detalle[];
}

interface Detalle {
  presentacion: string;
  precio_unitario: number;
  cantidad: number;
  sub_total: number;
}
